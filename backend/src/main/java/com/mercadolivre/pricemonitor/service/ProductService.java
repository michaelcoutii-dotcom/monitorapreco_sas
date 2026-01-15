package com.mercadolivre.pricemonitor.service;

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
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

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

    @Transactional
    public void removeProduct(Long id) {
        priceHistoryRepository.deleteByProductId(id);
        productRepository.deleteById(id);
        log.info("Removed product with ID: {}", id);
    }

    /**
     * Adds a new product to monitor. Scrapes the initial price immediately using a blocking call.
     * This is acceptable for a single, user-initiated action.
     */
    @Transactional
    public Product addProduct(String url, Long userId) {
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
     */
    @Transactional
    public void updateSingleProduct(Product product, ScrapeResponse scrapeData) {
        if (scrapeData == null || !scrapeData.isValid()) {
            log.warn("Skipping update for product '{}' - scraper returned invalid data.", product.getName());
            return;
        }

        Double oldPrice = product.getCurrentPrice();
        Double newPrice = scrapeData.getPrice();

        product.setLastPrice(oldPrice);
        product.setCurrentPrice(newPrice);
        product.setLastCheckedAt(LocalDateTime.now());
        product.setName(scrapeData.getTitle());
        if (scrapeData.getImageUrl() != null) {
            product.setImageUrl(scrapeData.getImageUrl());
        }

        productRepository.save(product);

        PriceHistory history = new PriceHistory(product, newPrice);
        priceHistoryRepository.save(history);

        log.info("Updated product '{}': Old Price: R$ {}, New Price: R$ {}", product.getName(), oldPrice, newPrice);
        
        // Handle notifications
        checkPriceAndNotify(product, oldPrice, newPrice);
    }

    /**
     * Checks for price changes and sends notifications if necessary.
     */
    private void checkPriceAndNotify(Product product, Double oldPrice, Double newPrice) {
        if (oldPrice == null) return;

        Optional<User> userOpt = userRepository.findById(product.getUserId());
        if (userOpt.isEmpty()) {
            log.warn("Cannot send notification, user not found for product ID {}", product.getId());
            return;
        }
        User user = userOpt.get();

        if (newPrice < oldPrice) {
            logPriceChange("PRICE DROP 🔻", product, oldPrice, newPrice);
            if (product.getNotifyOnPriceDrop()) {
                emailService.sendPriceDropNotification(user.getEmail(), product.getName(), product.getUrl(), oldPrice, newPrice);
            }
        } else if (newPrice > oldPrice) {
            logPriceChange("PRICE INCREASE 📈", product, oldPrice, newPrice);
            if (product.getNotifyOnPriceIncrease()) {
                emailService.sendPriceIncreaseNotification(user.getEmail(), product.getName(), product.getUrl(), oldPrice, newPrice);
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
}