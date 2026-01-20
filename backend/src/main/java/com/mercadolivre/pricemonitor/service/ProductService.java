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
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final TelegramService telegramService;

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

    // Limite de produtos para usuários não verificados (compartilhado com controller)
    public static final int UNVERIFIED_USER_PRODUCT_LIMIT = 7;

    /**
     * Adds a new product to monitor. Scrapes the initial price immediately using a blocking call.
     * This is acceptable for a single, user-initiated action.
     * 
     * Users with unverified email are limited to 7 products.
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

        try {
            // Block and wait for the single scrape result.
            ScrapeResponse scrapeData = scraperService.fetchProductData(url).get();

            if (scrapeData == null || !scrapeData.isValid()) {
                log.error("❌ Could not scrape valid product data for URL: {}", url);
                return null;
            }

            Product product = new Product();
            product.setName(scrapeData.getTitle());
            product.setUrl(url);
            product.setImageUrl(scrapeData.getImageUrl());
            product.setCurrentPrice(scrapeData.getPrice());
            product.setLastPrice(null);
            product.setLastCheckedAt(LocalDateTime.now());
            product.setUserId(userId);

            Product saved = productRepository.save(product);

            PriceHistory history = new PriceHistory(saved, scrapeData.getPrice());
            priceHistoryRepository.save(history);

            log.info("✅ Added new product for userId {}: '{}' at R$ {}", userId, saved.getName(), saved.getCurrentPrice());
            return saved;

        } catch (InterruptedException | ExecutionException e) {
            log.error("❌ Failed to scrape product data for URL {} during addProduct: {}", url, e.getMessage());
            Thread.currentThread().interrupt(); // Restore interruption status
            return null;
        }
    }

    /**
     * Updates a single product's data based on a fresh scrape.
     * This method is transactional and handles all database and notification logic.
     * Only saves to price history when the price actually changes.
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

        product.setLastPrice(oldPrice);
        product.setCurrentPrice(newPrice);
        product.setLastCheckedAt(LocalDateTime.now());
        product.setName(scrapeData.getTitle());
        if (scrapeData.getImageUrl() != null) {
            product.setImageUrl(scrapeData.getImageUrl());
        }

        productRepository.save(product);

        // Só salva no histórico se o preço REALMENTE mudou
        if (priceChanged) {
            PriceHistory history = new PriceHistory(product, newPrice);
            priceHistoryRepository.save(history);
            log.info("📊 Histórico salvo: '{}' - R$ {} → R$ {}", product.getName(), oldPrice, newPrice);
        }

        log.info("✅ Verificado '{}': R$ {} ({})", 
            product.getName(), newPrice, priceChanged ? "MUDOU" : "igual");
        
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
                emailService.sendPriceDropNotification(user.getEmail(), product.getName(), product.getUrl(), oldPrice, newPrice);
                // Also send Telegram notification
                telegramService.sendPriceDropNotification(user, product.getName(), product.getUrl(), oldPrice, newPrice);
            }
        } else if (newPrice > oldPrice) {
            logPriceChange("PRICE INCREASE 📈", product, oldPrice, newPrice);
            if (product.getNotifyOnPriceIncrease()) {
                emailService.sendPriceIncreaseNotification(user.getEmail(), product.getName(), product.getUrl(), oldPrice, newPrice);
                // Also send Telegram notification
                telegramService.sendPriceIncreaseNotification(user, product.getName(), product.getUrl(), oldPrice, newPrice);
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