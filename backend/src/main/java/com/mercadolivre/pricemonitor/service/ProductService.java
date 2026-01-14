package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.ScrapeResponse;
import com.mercadolivre.pricemonitor.model.Product;
import com.mercadolivre.pricemonitor.model.PriceHistory;
import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.ProductRepository;
import com.mercadolivre.pricemonitor.repository.PriceHistoryRepository;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Service containing the core business logic for product price monitoring.
 * 
 * Responsibilities:
 * - Update product prices from scraper
 * - Detect price drops
 * - Log price changes with full context
 * - Maintain price history
 * - Send email notifications on price drops
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

    private static final DateTimeFormatter TIMESTAMP_FORMAT = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Get all monitored products for a user.
     */
    public List<Product> getProductsByUserId(Long userId) {
        log.debug("Fetching products for userId: {}", userId);
        return productRepository.findByUserId(userId);
    }

    /**
     * Get all monitored products.
     */
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    /**
     * Get a product by ID.
     */
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    /**
     * Get price history for a product.
     */
    public List<PriceHistory> getPriceHistory(Long productId) {
        Optional<Product> product = productRepository.findById(productId);
        if (product.isEmpty()) {
            return List.of();
        }
        return priceHistoryRepository.findTop30ByProductOrderByRecordedAtDesc(product.get());
    }

    /**
     * Add a new product to monitor.
     * Scrapes the initial price immediately.
     */
    @Transactional
    public Product addProduct(String url, Long userId) {
        // Check if product already exists for this user
        if (productRepository.existsByUrlAndUserId(url, userId)) {
            log.warn("⚠️ Product with URL already exists for userId {}: {}", userId, url);
            return productRepository.findByUrlAndUserId(url, userId).orElse(null);
        }

        // Scrape initial data
        ScrapeResponse scrapeData = scraperService.fetchProductData(url);
        
        if (scrapeData == null) {
            log.error("❌ Could not scrape product data for URL: {}", url);
            return null;
        }

        // Create and save new product
        Product product = new Product();
        product.setName(scrapeData.getTitle());
        product.setUrl(url);
        product.setImageUrl(scrapeData.getImageUrl());
        product.setCurrentPrice(scrapeData.getPrice());
        product.setLastPrice(null); // No previous price yet
        product.setLastCheckedAt(LocalDateTime.now());
        product.setUserId(userId);

        Product saved = productRepository.save(product);
        
        // Save initial price history
        PriceHistory history = new PriceHistory(saved, scrapeData.getPrice());
        priceHistoryRepository.save(history);
        
        log.info("✅ Added new product for userId {}: '{}' at R$ {}", userId, saved.getName(), saved.getCurrentPrice());
        
        return saved;
    }

    /**
     * Remove a product from monitoring.
     */
    @Transactional
    public void removeProduct(Long id) {
        productRepository.deleteById(id);
        log.info("Removed product with ID: {}", id);
    }

    /**
     * Update prices for all monitored products.
     * 
     * For each product:
     * 1. Call the scraper API
     * 2. Store current price in lastPrice
     * 3. Update currentPrice with new value
     * 4. Log if price dropped
     * 
     * This method does NOT throw exceptions if individual products fail.
     */
    @Transactional
    public void updateProductPrices() {
        List<Product> products = productRepository.findAll();
        
        if (products.isEmpty()) {
            log.info("No products to update");
            return;
        }

        log.info("Starting price update for {} products", products.size());
        
        int successCount = 0;
        int failCount = 0;
        int priceDropCount = 0;

        for (Product product : products) {
            try {
                boolean updated = updateSingleProduct(product);
                
                if (updated) {
                    successCount++;
                    
                    // Check for price drop
                    if (hasPriceDropped(product)) {
                        priceDropCount++;
                    }
                } else {
                    failCount++;
                }
                
            } catch (Exception e) {
                // Ensure one product failure doesn't stop the entire update
                log.error("Error updating product '{}': {}", product.getName(), e.getMessage());
                failCount++;
            }
        }

        log.info("Price update complete. Success: {}, Failed: {}, Price drops: {}", 
                 successCount, failCount, priceDropCount);
    }

    /**
     * Update a single product's price.
     * 
     * @return true if update succeeded, false otherwise
     */
    private boolean updateSingleProduct(Product product) {
        ScrapeResponse scrapeData = scraperService.fetchProductData(product.getUrl());
        
        if (scrapeData == null) {
            log.warn("Skipping product '{}' - scraper returned null", product.getName());
            return false;
        }

        // Store current price as last price BEFORE updating
        Double oldPrice = product.getCurrentPrice();
        product.setLastPrice(oldPrice);
        
        // Update with new price
        Double newPrice = scrapeData.getPrice();
        product.setCurrentPrice(newPrice);
        product.setLastCheckedAt(LocalDateTime.now());
        
        // Update name in case it changed
        product.setName(scrapeData.getTitle());
        
        // Update image URL if available
        if (scrapeData.getImageUrl() != null) {
            product.setImageUrl(scrapeData.getImageUrl());
        }
        
        // Save changes
        productRepository.save(product);
        
        // Save price history
        PriceHistory history = new PriceHistory(product, newPrice);
        priceHistoryRepository.save(history);
        
        // Check for price changes and send email notifications
        try {
            Optional<User> user = userRepository.findById(product.getUserId());
            if (user.isPresent()) {
                if (oldPrice != null && newPrice < oldPrice) {
                    // Price dropped
                    logPriceDrop(product, oldPrice, newPrice);
                    emailService.sendPriceDropNotification(
                        user.get().getEmail(),
                        product.getName(),
                        product.getUrl(),
                        oldPrice,
                        newPrice
                    );
                } else if (oldPrice != null && newPrice > oldPrice) {
                    // Price increased
                    logPriceIncrease(product, oldPrice, newPrice);
                    emailService.sendPriceIncreaseNotification(
                        user.get().getEmail(),
                        product.getName(),
                        product.getUrl(),
                        oldPrice,
                        newPrice
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to send email notification for product {}: {}", 
                product.getName(), e.getMessage());
        }
        
        return true;
    }

    /**
     * Log price increase with context.
     */
    private void logPriceIncrease(Product product, Double oldPrice, Double newPrice) {
        double increase = newPrice - oldPrice;
        double percentIncrease = (increase / oldPrice) * 100;
        
        log.info("========================================");
        log.info("📈 PRICE INCREASED: {}", product.getName());
        log.info("   Previous: R$ {}", String.format("%.2f", oldPrice));
        log.info("   Current:  R$ {}", String.format("%.2f", newPrice));
        log.info("   Increase: R$ {} (+{}%)", 
            String.format("%.2f", increase),
            String.format("%.1f", percentIncrease));
        log.info("========================================");
    }

    /**
     * Check if the product's current price is lower than its last price.
     */
    private boolean hasPriceDropped(Product product) {
        return product.getLastPrice() != null && 
               product.getCurrentPrice() != null &&
               product.getCurrentPrice() < product.getLastPrice();
    }

    /**
     * Log a price drop with all relevant information.
     * 
     * Format: [PRICE DROP] Product: X | Old: R$ Y | New: R$ Z | Timestamp: T
     */
    private void logPriceDrop(Product product, Double oldPrice, Double newPrice) {
        double savings = oldPrice - newPrice;
        double percentDrop = (savings / oldPrice) * 100;
        
        log.info("🔻 [PRICE DROP] Product: '{}' | Old: R$ {} | New: R$ {} | Savings: R$ {} ({}%) | Timestamp: {}",
                product.getName(),
                String.format("%.2f", oldPrice),
                String.format("%.2f", newPrice),
                String.format("%.2f", savings),
                String.format("%.1f", percentDrop),
                LocalDateTime.now().format(TIMESTAMP_FORMAT));
    }

    /**
     * Get all products that currently have a price drop.
     */
    public List<Product> getProductsWithPriceDrops() {
        return productRepository.findAll().stream()
                .filter(this::hasPriceDropped)
                .toList();
    }
}
