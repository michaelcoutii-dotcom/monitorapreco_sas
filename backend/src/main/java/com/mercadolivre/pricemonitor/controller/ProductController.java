package com.mercadolivre.pricemonitor.controller;

import com.mercadolivre.pricemonitor.model.Product;
import com.mercadolivre.pricemonitor.scheduler.PriceCheckScheduler;
import com.mercadolivre.pricemonitor.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Product operations.
 * 
 * Endpoints:
 * - GET  /api/products          - List all products
 * - GET  /api/products/{id}     - Get product by ID
 * - POST /api/products          - Add new product
 * - DELETE /api/products/{id}   - Remove product
 * - POST /api/products/refresh  - Trigger manual price update
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;
    private final PriceCheckScheduler scheduler;

    /**
     * Get all monitored products for authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        try {
            Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            log.debug("Fetching products for userId: {}", userId);
            
            List<Product> products = productService.getProductsByUserId(userId);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            log.error("❌ Error fetching all products", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific product by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        try {
            return productService.getProductById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching product by id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Add a new product to monitor.
     * 
     * Request body: { "url": "https://mercadolivre.com.br/..." }
     */
    @PostMapping
    public ResponseEntity<?> addProduct(@RequestBody Map<String, String> request) {
        try {
            Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String url = request.get("url");
            
            if (url == null || url.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "URL is required"));
            }

            log.info("➕ Adding new product for userId: {}, URL: {}", userId, url);
            Product product = productService.addProduct(url, userId);
            
            if (product == null) {
                log.warn("Could not scrape product from URL: {}", url);
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body(Map.of(
                            "error", "Could not scrape product. Check if the URL is valid and the scraper is running.",
                            "details", "Make sure the Python scraper is running on port 8000"
                        ));
            }

            log.info("Product added successfully: {}", product.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(product);
            
        } catch (Exception e) {
            log.error("Error adding product", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Server error while adding product",
                        "details", e.getMessage()
                    ));
        }
    }

    /**
     * Remove a product from monitoring.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeProduct(@PathVariable Long id) {
        try {
            if (productService.getProductById(id).isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            log.info("Removing product with ID: {}", id);
            productService.removeProduct(id);
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            log.error("Error removing product with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Trigger a manual price refresh for all products.
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshPrices() {
        try {
            log.info("Manual price refresh triggered");
            scheduler.triggerManualCheck();
            return ResponseEntity.ok(Map.of("message", "Price refresh triggered"));
        } catch (Exception e) {
            log.error("Error triggering price refresh", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to trigger price refresh"));
        }
    }

    /**
     * Get only products that have price drops.
     */
    @GetMapping("/drops")
    public ResponseEntity<List<Product>> getProductsWithDrops() {
        try {
            List<Product> products = productService.getProductsWithPriceDrops();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            log.error("Error fetching products with drops", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
