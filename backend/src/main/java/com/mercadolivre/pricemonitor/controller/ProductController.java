package com.mercadolivre.pricemonitor.controller;

import com.mercadolivre.pricemonitor.model.Product;
import com.mercadolivre.pricemonitor.scheduler.PriceCheckScheduler;
import com.mercadolivre.pricemonitor.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;
    private final PriceCheckScheduler scheduler;

    /**
     * Get all monitored products.
     */
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * Get a specific product by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Add a new product to monitor.
     * 
     * Request body: { "url": "https://mercadolivre.com.br/..." }
     */
    @PostMapping
    public ResponseEntity<?> addProduct(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        
        if (url == null || url.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "URL is required"));
        }

        Product product = productService.addProduct(url);
        
        if (product == null) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of("error", "Could not scrape product. Check if the URL is valid."));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    /**
     * Remove a product from monitoring.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeProduct(@PathVariable Long id) {
        if (productService.getProductById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        productService.removeProduct(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Trigger a manual price refresh for all products.
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refreshPrices() {
        scheduler.triggerManualCheck();
        return ResponseEntity.ok(Map.of("message", "Price refresh triggered"));
    }

    /**
     * Get only products that have price drops.
     */
    @GetMapping("/drops")
    public ResponseEntity<List<Product>> getProductsWithDrops() {
        List<Product> products = productService.getProductsWithPriceDrops();
        return ResponseEntity.ok(products);
    }
}
