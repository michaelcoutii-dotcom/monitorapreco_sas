package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.AnalyticsResponse;
import com.mercadolivre.pricemonitor.dto.ScrapeResponse;
import com.mercadolivre.pricemonitor.model.PriceHistory;
import com.mercadolivre.pricemonitor.model.Product;
import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.PriceHistoryRepository;
import com.mercadolivre.pricemonitor.repository.ProductRepository;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

/**
 * Service containing the core business logic for product price monitoring.
 * This service now uses asynchronous methods for scraping and handles individual product logic.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final UserRepository userRepository;
    private final ScraperService scraperService;
    private final BrevoEmailService brevoEmailService; // Use Brevo API (works on Railway)
    private final NotificationService notificationService;
    private final TelegramService telegramService;
    private final AsyncScrapingService asyncScrapingService; // For background scraping

    public List<Product> getProductsByUserId(Long userId) {
        log.debug("Fetching products for userId: {}", userId);
        return productRepository.findByUserId(userId);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    /**
     * Check if a product with the given URL already exists for a user.
     * Normalizes URL before checking to handle variations.
     */
    public boolean existsByUrlAndUserId(String url, Long userId) {
        String normalizedUrl = normalizeUrl(url);
        // Check both exact match and normalized match
        return productRepository.existsByUrlAndUserId(url, userId) ||
               productRepository.existsByUrlAndUserId(normalizedUrl, userId);
    }

    /**
     * Normalize URL to avoid duplicates with different parameters/fragments.
     */
    private String normalizeUrl(String url) {
        if (url == null) return null;
        // Remove fragments
        if (url.contains("#")) {
            url = url.split("#")[0];
        }
        // Remove query parameters
        if (url.contains("?")) {
            url = url.split("\\?")[0];
        }
        return url.trim();
    }

    public List<PriceHistory> getPriceHistory(Long productId) {
        return productRepository.findById(productId)
                .map(priceHistoryRepository::findTop30ByProductOrderByRecordedAtDesc)
                .orElse(List.of());
    }

    /**
     * Remove duplicate price history entries (same price as previous).
     * Processes all history records and removes duplicates in Java.
     * Returns the number of deleted records.
     */
    @Transactional
    public int cleanupDuplicateHistory() {
        List<PriceHistory> allHistory = priceHistoryRepository.findAllOrderByProductAndDate();
        
        if (allHistory.isEmpty()) {
            return 0;
        }
        
        List<Long> idsToDelete = new ArrayList<>();
        Long currentProductId = null;
        Double lastPrice = null;
        
        for (PriceHistory ph : allHistory) {
            Long productId = ph.getProduct().getId();
            
            // Novo produto - resetar lastPrice
            if (!productId.equals(currentProductId)) {
                currentProductId = productId;
                lastPrice = ph.getPrice();
                continue; // Primeiro registro do produto, manter
            }
            
            // Mesmo produto - verificar se preço é igual ao anterior
            if (lastPrice != null && ph.getPrice() != null 
                && Math.abs(lastPrice - ph.getPrice()) < 0.01) {
                // Preço igual ao anterior - marcar para deletar
                idsToDelete.add(ph.getId());
            } else {
                // Preço diferente - atualizar lastPrice
                lastPrice = ph.getPrice();
            }
        }
        
        if (idsToDelete.isEmpty()) {
            log.info("🧹 Nenhum registro duplicado encontrado");
            return 0;
        }
        
        // Deletar em batches de 1000 para evitar problemas com queries muito grandes
        int totalDeleted = 0;
        int batchSize = 1000;
        for (int i = 0; i < idsToDelete.size(); i += batchSize) {
            List<Long> batch = idsToDelete.subList(i, Math.min(i + batchSize, idsToDelete.size()));
            int deleted = priceHistoryRepository.deleteByIds(batch);
            totalDeleted += deleted;
        }
        
        log.info("🧹 Removidos {} registros duplicados de histórico", totalDeleted);
        return totalDeleted;
    }

    @Transactional
    public void removeProduct(Long id) {
        priceHistoryRepository.deleteByProductId(id);
        productRepository.deleteById(id);
        log.info("Removed product with ID: {}", id);
    }

    // Limite de produtos para usuários não verificados (fase de teste)
    public static final int UNVERIFIED_USER_PRODUCT_LIMIT = 4;

    /**
     * Adds a new product to monitor. Scrapes the initial price immediately using a blocking call.
     * This is acceptable for a single, user-initiated action.
     * 
     * Users with unverified email are limited to 4 products.
     * After email verification, users can add unlimited products.
     * 
     * OPTIMIZED: Product is saved immediately with PENDING status,
     * scraping happens in background for instant user feedback.
     */
    @Transactional
    public Product addProduct(String url, Long userId) {
        // Verificar limite de produtos para usuários não verificados
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && !Boolean.TRUE.equals(user.getEmailVerified())) {
            long productCount = productRepository.countByUserId(userId);
            if (productCount >= UNVERIFIED_USER_PRODUCT_LIMIT) {
                log.warn("⚠️ Usuário {} atingiu limite de {} produtos (email não verificado)", userId, UNVERIFIED_USER_PRODUCT_LIMIT);
                throw new ProductLimitExceededException(
                    "Verifique seu email para monitorar mais de " + UNVERIFIED_USER_PRODUCT_LIMIT + " produtos",
                    UNVERIFIED_USER_PRODUCT_LIMIT
                );
            }
        }

        if (productRepository.existsByUrlAndUserId(url, userId)) {
            log.warn("⚠️ Product with URL already exists for userId {}: {}", userId, url);
            return productRepository.findByUrlAndUserId(url, userId).orElse(null);
        }

        // Extrair nome temporário da URL para feedback rápido
        String tempName = extractProductNameFromUrl(url);

        // Criar produto imediatamente com status PENDING
        Product product = new Product();
        product.setName(tempName);
        product.setUrl(url);
        product.setImageUrl(null); // Will be filled by scraper
        product.setCurrentPrice(null); // Will be filled by scraper
        product.setLastPrice(null);
        product.setLastCheckedAt(LocalDateTime.now());
        product.setUserId(userId);
        product.setStatus("PENDING");

        Product saved = productRepository.save(product);
        log.info("⏳ Product added with PENDING status for userId {}: {}", userId, url);

        // Disparar scraping em background via serviço separado (garante que @Async funciona!)
        asyncScrapingService.scrapeProductInBackground(saved.getId(), url);

        return saved;
    }

    /**
     * Extract a temporary product name from URL for immediate feedback.
     */
    private String extractProductNameFromUrl(String url) {
        try {
            // Try to extract MLB ID or product slug from URL
            // Example: https://www.mercadolivre.com.br/produto-xyz-MLB12345
            String[] parts = url.split("/");
            for (String part : parts) {
                if (part.contains("MLB") || part.length() > 20) {
                    // Clean up the slug
                    return part.replace("-", " ")
                              .replaceAll("MLB\\d+", "")
                              .trim();
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "Carregando produto...";
    }

    /**
     * Triggers an async update for a single product.
     * Used for force-update feature.
     */
    public void updateSingleProductAsync(Product product) {
        log.info("🔄 Triggering async update for product: {} ({})", product.getName(), product.getId());
        asyncScrapingService.scrapeProductInBackground(product.getId(), product.getUrl());
    }

    /**
     * Updates a single product's data based on a fresh scrape.
     * This method is transactional and handles all database and notification logic.
     * Saves to price history when:
     * 1. The price actually changes, OR
     * 2. At least once per day (for statistics purposes)
     */
    @Transactional
    public void updateSingleProduct(Product product, ScrapeResponse scrapeData) {
        if (scrapeData == null || !scrapeData.isValid()) {
            log.warn("Skipping update for product '{}' - scraper returned invalid data.", product.getName());
            return;
        }

        Double oldPrice = product.getCurrentPrice();
        Double newPrice = scrapeData.getPrice();
        
        // Verificar se o preço realmente mudou (com tolerância para evitar falsos positivos)
        boolean priceChanged = false;
        if (oldPrice == null && newPrice != null) {
            priceChanged = true; // Primeira vez que tem preço
        } else if (oldPrice != null && newPrice != null) {
            // Só considera mudança se diferença for maior que 0.01 (1 centavo)
            priceChanged = Math.abs(oldPrice - newPrice) >= 0.01;
        }

        // Só atualiza lastPrice quando o preço realmente muda (para manter a variação visível)
        if (priceChanged) {
            product.setLastPrice(oldPrice);
        }
        product.setCurrentPrice(newPrice);
        product.setOriginalPrice(scrapeData.getOriginalPrice());
        product.setDiscountPercent(scrapeData.getDiscountPercent());
        product.setLastCheckedAt(LocalDateTime.now());
        product.setName(scrapeData.getTitle());
        if (scrapeData.getImageUrl() != null) {
            product.setImageUrl(scrapeData.getImageUrl());
        }

        productRepository.save(product);

        // Verificar se deve salvar no histórico
        boolean shouldSaveHistory = priceChanged;
        
        // Se o preço não mudou, verificar se já tem registro hoje
        if (!priceChanged) {
            List<PriceHistory> recentHistory = priceHistoryRepository.findByProductIdSince(
                product.getId(), 
                LocalDateTime.now().minusHours(12) // Verifica últimas 12 horas
            );
            // Se não tem registro nas últimas 12h, salva para ter dados de estatísticas
            if (recentHistory.isEmpty()) {
                shouldSaveHistory = true;
                log.debug("📊 Salvando histórico periódico para '{}' (sem mudança, mas 12h+ desde último registro)", product.getName());
            }
        }

        if (shouldSaveHistory) {
            PriceHistory history = new PriceHistory(product, newPrice);
            priceHistoryRepository.save(history);
            if (priceChanged) {
                log.info("📊 Histórico salvo: '{}' - R$ {} → R$ {}", product.getName(), oldPrice, newPrice);
            }
        }

        // Log com informação de desconto se houver
        String discountInfo = "";
        if (product.getDiscountPercent() != null && product.getDiscountPercent() > 0) {
            discountInfo = String.format(" (🏷️ %d%% OFF)", product.getDiscountPercent());
        }
        log.info("✅ Verificado '{}': R$ {}{} ({})", 
            product.getName(), newPrice, discountInfo, priceChanged ? "MUDOU" : "igual");
        
        // Handle notifications (só notifica se mudou)
        if (priceChanged) {
            checkPriceAndNotify(product, oldPrice, newPrice);
        }
    }

    /**
     * Checks for price changes and sends notifications if necessary.
     */
    private void checkPriceAndNotify(Product product, Double oldPrice, Double newPrice) {
        if (oldPrice == null) return;
        // Only notify if price actually changed
        if (oldPrice.equals(newPrice)) return;

        Optional<User> userOpt = userRepository.findById(product.getUserId());
        if (userOpt.isEmpty()) {
            log.warn("Cannot send notification, user not found for product ID {}", product.getId());
            return;
        }
        User user = userOpt.get();

        // Always create in-app notification (bell icon)
        try {
            notificationService.createPriceChangeNotification(
                product.getUserId(),
                product.getId(),
                product.getName(),
                oldPrice,
                newPrice
            );
            log.info("🔔 In-app notification created for product: {}", product.getName());
        } catch (Exception e) {
            log.error("Failed to create in-app notification: {}", e.getMessage());
        }

        // Send email notification based on user preferences
        if (newPrice < oldPrice) {
            logPriceChange("PRICE DROP 🔻", product, oldPrice, newPrice);
            if (product.getNotifyOnPriceDrop()) {
                log.info("📧 Tentando enviar email de queda de preço para: {} | Brevo configurado: {}", 
                    user.getEmail(), brevoEmailService.isConfigured());
                brevoEmailService.sendPriceDropNotification(user.getEmail(), product.getName(), product.getUrl(), oldPrice, newPrice);
                // Also send Telegram notification
                telegramService.sendPriceDropNotification(user, product.getName(), product.getUrl(), oldPrice, newPrice);
            } else {
                log.info("📧 Notificação de queda de preço desativada para produto: {}", product.getName());
            }
        } else if (newPrice > oldPrice) {
            logPriceChange("PRICE INCREASE 📈", product, oldPrice, newPrice);
            if (product.getNotifyOnPriceIncrease()) {
                log.info("📧 Tentando enviar email de aumento de preço para: {} | Brevo configurado: {}", 
                    user.getEmail(), brevoEmailService.isConfigured());
                brevoEmailService.sendPriceIncreaseNotification(user.getEmail(), product.getName(), product.getUrl(), oldPrice, newPrice);
                // Also send Telegram notification
                telegramService.sendPriceIncreaseNotification(user, product.getName(), product.getUrl(), oldPrice, newPrice);
            } else {
                log.info("📧 Notificação de aumento de preço desativada para produto: {}", product.getName());
            }
        }
    }

    /**
     * Generic logger for price changes.
     */
    private void logPriceChange(String event, Product product, Double oldPrice, Double newPrice) {
        double change = newPrice - oldPrice;
        double percentChange = (change / oldPrice) * 100;
        
        log.info("========================================");
        log.info(">> {}: {}", event, product.getName());
        log.info("   - Previous: R$ {}", String.format("%.2f", oldPrice));
        log.info("   - Current:  R$ {}", String.format("%.2f", newPrice));
        log.info("   - Change:   R$ {} ({}%)",
            String.format("%.2f", change),
            String.format("%.1f", percentChange));
        log.info("========================================");
    }

    public List<Product> getProductsWithPriceDrops() {
        return productRepository.findProductsWithPriceDrop();
    }

    @Transactional
    public Product updateProduct(Product product) {
        return productRepository.save(product);
    }

    /**
     * Get price analytics for a user.
     * Includes: changes per day, per hour, top changing products, etc.
     */
    public AnalyticsResponse getAnalytics(Long userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        
        // Total de mudanças
        Long totalChanges = priceHistoryRepository.countTotalChangesForUser(userId, since);
        
        // Total de produtos
        List<Product> products = productRepository.findByUserId(userId);
        
        // Mudanças por data
        List<Object[]> changesByDateRaw = priceHistoryRepository.countChangesByDateForUser(userId, since);
        List<AnalyticsResponse.DailyChange> changesByDate = (changesByDateRaw != null ? changesByDateRaw.stream() : java.util.stream.Stream.<Object[]>empty())
                .map(row -> AnalyticsResponse.DailyChange.builder()
                        .date(row[0].toString())
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());
        
        // Mudanças por hora
        List<Object[]> changesByHourRaw = priceHistoryRepository.countChangesByHourForUser(userId, since);
        Map<Integer, Long> changesByHour = new LinkedHashMap<>();
        // Inicializar todas as horas com 0
        for (int i = 0; i < 24; i++) {
            changesByHour.put(i, 0L);
        }
        int peakHour = 0;
        long maxHourCount = 0;
        if (changesByHourRaw != null) {
            for (Object[] row : changesByHourRaw) {
                int hour = ((Number) row[0]).intValue();
                long count = ((Number) row[1]).longValue();
                changesByHour.put(hour, count);
                if (count > maxHourCount) {
                    maxHourCount = count;
                    peakHour = hour;
                }
            }
        }
        
        // Mudanças por dia da semana
        String[] dayNames = {"", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"};
        List<Object[]> changesByDowRaw = priceHistoryRepository.countChangesByDayOfWeekForUser(userId, since);
        Map<String, Long> changesByDayOfWeek = new LinkedHashMap<>();
        // Inicializar todos os dias com 0
        for (int i = 1; i <= 7; i++) {
            changesByDayOfWeek.put(dayNames[i], 0L);
        }
        String peakDayOfWeek = "Segunda";
        long maxDayCount = 0;
        if (changesByDowRaw != null) {
            for (Object[] row : changesByDowRaw) {
                int dow = ((Number) row[0]).intValue();
                long count = ((Number) row[1]).longValue();
                String dayName = dayNames[dow];
                changesByDayOfWeek.put(dayName, count);
                if (count > maxDayCount) {
                    maxDayCount = count;
                    peakDayOfWeek = dayName;
                }
            }
        }
        
        // Top produtos com mais mudanças
        List<Object[]> topProductsRaw = priceHistoryRepository.countChangesByProductForUser(userId, since);
        List<AnalyticsResponse.ProductChangeRank> topChangingProducts = (topProductsRaw != null ? topProductsRaw.stream() : java.util.stream.Stream.<Object[]>empty())
                .limit(10)
                .map(row -> AnalyticsResponse.ProductChangeRank.builder()
                        .productId(((Number) row[0]).longValue())
                        .productName(truncate((String) row[1], 50))
                        .changeCount(((Number) row[2]).longValue())
                        .build())
                .collect(Collectors.toList());
        
        // Média de mudanças por dia
        double avgChangesPerDay = days > 0 && totalChanges != null ? (double) totalChanges / days : 0;
        
        return AnalyticsResponse.builder()
                .totalChanges(totalChanges != null ? totalChanges : 0L)
                .totalProducts(products.size())
                .avgChangesPerDay(Math.round(avgChangesPerDay * 10) / 10.0)
                .changesByDate(changesByDate)
                .changesByHour(changesByHour)
                .changesByDayOfWeek(changesByDayOfWeek)
                .topChangingProducts(topChangingProducts)
                .peakHour(peakHour)
                .peakDayOfWeek(peakDayOfWeek)
                .build();
    }
    
    private String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }
}