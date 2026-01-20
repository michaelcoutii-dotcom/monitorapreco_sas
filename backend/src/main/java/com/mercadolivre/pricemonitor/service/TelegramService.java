package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for sending Telegram notifications.
 * 
 * To set up:
 * 1. Create a bot with @BotFather on Telegram
 * 2. Get the bot token
 * 3. Set TELEGRAM_BOT_TOKEN in environment variables
 */
@Service
@Slf4j
public class TelegramService {

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Value("${telegram.bot.username:}")
    private String botUsername;
    
    @Value("${telegram.use.webhook:false}")
    private boolean useWebhook;

    private final RestTemplate restTemplate = new RestTemplate();
    private final UserRepository userRepository;
    
    private long lastUpdateId = 0;

    public TelegramService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void init() {
        if (isEnabled()) {
            log.info("📱 Telegram Bot configurado: @{}", botUsername);
            if (useWebhook) {
                log.info("📱 Modo WEBHOOK ativado (produção)");
            } else {
                log.info("📱 Modo POLLING ativado (desenvolvimento)");
            }
        } else {
            log.warn("⚠️ Telegram Bot NÃO configurado - token vazio");
        }
    }

    /**
     * Poll for new messages every 3 seconds (only in dev mode, not webhook)
     */
    @Scheduled(fixedDelay = 3000)
    public void pollUpdates() {
        // Skip polling if using webhook or not enabled
        if (!isEnabled() || useWebhook) return;
        
        try {
            String url = String.format(
                "https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=1", 
                botToken, lastUpdateId + 1
            );
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                if (Boolean.TRUE.equals(body.get("ok"))) {
                    List<Map> updates = (List<Map>) body.get("result");
                    if (updates != null) {
                        for (Map update : updates) {
                            processUpdate(update);
                            lastUpdateId = ((Number) update.get("update_id")).longValue();
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Silent fail - don't spam logs
        }
    }

    /**
     * Process incoming Telegram update (called by polling or webhook)
     */
    public void processUpdate(Map update) {
        try {
            Map message = (Map) update.get("message");
            if (message == null) return;
            
            Map chat = (Map) message.get("chat");
            String chatId = String.valueOf(((Number) chat.get("id")).longValue());
            String text = (String) message.get("text");
            
            if (text == null) return;
            
            log.info("📱 Telegram message received: {} from chat {}", text, chatId);
            
            // Handle /start command with code
            if (text.startsWith("/start")) {
                String[] parts = text.split(" ");
                if (parts.length > 1) {
                    String code = parts[1];
                    boolean success = linkAccount(code, chatId);
                    if (!success) {
                        sendMessage(chatId, "❌ Código inválido ou expirado.\n\nGere um novo código no painel.");
                    }
                } else {
                    sendMessage(chatId, "👋 Olá! Para vincular sua conta:\n\n" +
                        "1. Acesse o painel em monitorapreco.com\n" +
                        "2. Clique em 'Vincular Telegram'\n" +
                        "3. Copie o código gerado\n" +
                        "4. Envie: /start CODIGO");
                }
            }
        } catch (Exception e) {
            log.error("❌ Error processing Telegram update: {}", e.getMessage());
        }
    }

    /**
     * Check if Telegram is configured.
     */
    public boolean isEnabled() {
        return botToken != null && !botToken.isBlank();
    }

    /**
     * Get bot username for linking.
     */
    public String getBotUsername() {
        return botUsername;
    }

    /**
     * Generate a link code for user to connect their Telegram.
     */
    public String generateLinkCode(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        // Generate 6-digit code
        String code = String.format("%06d", (int)(Math.random() * 1000000));
        
        user.setTelegramLinkCode(code);
        user.setTelegramLinkExpires(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        
        log.info("📱 Generated Telegram link code for user {}: {}", user.getEmail(), code);
        return code;
    }

    /**
     * Link Telegram account using code (called by bot webhook).
     */
    public boolean linkAccount(String code, String chatId) {
        Optional<User> userOpt = userRepository.findAll().stream()
            .filter(u -> code.equals(u.getTelegramLinkCode()))
            .filter(u -> u.getTelegramLinkExpires() != null && 
                        u.getTelegramLinkExpires().isAfter(LocalDateTime.now()))
            .findFirst();

        if (userOpt.isEmpty()) {
            log.warn("❌ Invalid or expired Telegram link code: {}", code);
            return false;
        }

        User user = userOpt.get();
        user.setTelegramChatId(chatId);
        user.setTelegramEnabled(true);
        user.setTelegramLinkCode(null);
        user.setTelegramLinkExpires(null);
        userRepository.save(user);

        log.info("✅ Telegram linked for user {}, chatId: {}", user.getEmail(), chatId);
        
        // Send welcome message
        sendMessage(chatId, "🎉 *Conta vinculada com sucesso!*\n\n" +
            "Você receberá alertas de preço diretamente aqui no Telegram.\n\n" +
            "📦 MonitoraPreço - Inteligência Competitiva");

        return true;
    }

    /**
     * Unlink Telegram account.
     */
    public void unlinkAccount(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setTelegramChatId(null);
            user.setTelegramEnabled(false);
            userRepository.save(user);
            log.info("📱 Telegram unlinked for user {}", user.getEmail());
        }
    }

    /**
     * Send a text message to a chat.
     */
    @Async
    public void sendMessage(String chatId, String text) {
        if (!isEnabled() || chatId == null || chatId.isBlank()) {
            return;
        }

        try {
            String url = String.format("https://api.telegram.org/bot%s/sendMessage", botToken);
            
            Map<String, Object> body = new HashMap<>();
            body.put("chat_id", chatId);
            body.put("text", text);
            body.put("parse_mode", "Markdown");
            body.put("disable_web_page_preview", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.debug("📱 Telegram message sent to {}", chatId);
            } else {
                log.warn("📱 Telegram API error: {}", response.getBody());
            }
        } catch (Exception e) {
            log.error("❌ Failed to send Telegram message: {}", e.getMessage());
        }
    }

    /**
     * Send price drop notification.
     */
    @Async
    public void sendPriceDropNotification(User user, String productName, String productUrl, 
                                          Double oldPrice, Double newPrice) {
        if (!isEnabled() || user.getTelegramChatId() == null || !Boolean.TRUE.equals(user.getTelegramEnabled())) {
            return;
        }

        double savings = oldPrice - newPrice;
        double percentDrop = (savings / oldPrice) * 100;
        
        String emoji;
        if (percentDrop >= 20) {
            emoji = "🔥🔥🔥";
        } else if (percentDrop >= 10) {
            emoji = "⚡⚡";
        } else {
            emoji = "💰";
        }

        String message = String.format(
            "%s *PREÇO BAIXOU %.0f%%!*\n\n" +
            "📦 *%s*\n\n" +
            "💵 De: ~R$ %.2f~\n" +
            "✅ Por: *R$ %.2f*\n" +
            "💰 Economia: *R$ %.2f*\n\n" +
            "[🛒 Ver Produto](%s)",
            emoji, percentDrop, truncate(productName, 100),
            oldPrice, newPrice, savings, productUrl
        );

        sendMessage(user.getTelegramChatId(), message);
        log.info("📱 Telegram price drop sent to user {}", user.getEmail());
    }

    /**
     * Send price increase notification.
     */
    @Async
    public void sendPriceIncreaseNotification(User user, String productName, String productUrl,
                                              Double oldPrice, Double newPrice) {
        if (!isEnabled() || user.getTelegramChatId() == null || !Boolean.TRUE.equals(user.getTelegramEnabled())) {
            return;
        }

        double increase = newPrice - oldPrice;
        double percentIncrease = (increase / oldPrice) * 100;

        String message = String.format(
            "📈 *PREÇO SUBIU %.0f%%*\n\n" +
            "📦 *%s*\n\n" +
            "💵 Era: R$ %.2f\n" +
            "⬆️ Agora: *R$ %.2f*\n" +
            "📊 Aumento: R$ %.2f\n\n" +
            "[🔍 Ver Produto](%s)",
            percentIncrease, truncate(productName, 100),
            oldPrice, newPrice, increase, productUrl
        );

        sendMessage(user.getTelegramChatId(), message);
        log.info("📱 Telegram price increase sent to user {}", user.getEmail());
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
    }
}
