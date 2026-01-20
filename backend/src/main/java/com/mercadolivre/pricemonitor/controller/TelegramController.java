package com.mercadolivre.pricemonitor.controller;

import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import com.mercadolivre.pricemonitor.service.TelegramService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for Telegram integration.
 */
@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
@Slf4j
public class TelegramController {

    private final TelegramService telegramService;
    private final UserRepository userRepository;

    /**
     * Get Telegram status for the authenticated user.
     */
    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
            "enabled", telegramService.isEnabled(),
            "linked", user.getTelegramChatId() != null,
            "telegramEnabled", Boolean.TRUE.equals(user.getTelegramEnabled()),
            "botUsername", telegramService.getBotUsername() != null ? telegramService.getBotUsername() : ""
        ));
    }

    /**
     * Generate a link code to connect Telegram account.
     */
    @PostMapping("/generate-code")
    public ResponseEntity<?> generateLinkCode() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        if (!telegramService.isEnabled()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Telegram não está configurado"
            ));
        }

        String code = telegramService.generateLinkCode(userId);
        if (code == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Erro ao gerar código"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "code", code,
            "botUsername", telegramService.getBotUsername(),
            "expiresIn", 600 // 10 minutes
        ));
    }

    /**
     * Unlink Telegram account.
     */
    @PostMapping("/unlink")
    public ResponseEntity<?> unlinkAccount() {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        telegramService.unlinkAccount(userId);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Telegram desvinculado com sucesso"
        ));
    }

    /**
     * Toggle Telegram notifications.
     */
    @PostMapping("/toggle")
    public ResponseEntity<?> toggleNotifications(@RequestBody Map<String, Boolean> request) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        if (user.getTelegramChatId() == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Vincule sua conta do Telegram primeiro"
            ));
        }

        Boolean enabled = request.get("enabled");
        user.setTelegramEnabled(enabled != null && enabled);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "telegramEnabled", user.getTelegramEnabled()
        ));
    }

    /**
     * Webhook endpoint for Telegram bot updates.
     * This receives messages from Telegram when users interact with the bot.
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Map<String, Object> update) {
        log.info("📱 Telegram webhook received");
        
        try {
            // Delegate to TelegramService
            telegramService.processUpdate(update);
        } catch (Exception e) {
            log.error("❌ Error processing Telegram webhook: {}", e.getMessage());
        }

        return ResponseEntity.ok().build();
    }
}
