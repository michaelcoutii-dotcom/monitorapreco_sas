package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.ScrapeResponse;
import com.mercadolivre.pricemonitor.model.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Service dedicated to performing asynchronous and parallel product price updates.
 * This is designed to be called from the scheduler.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AsyncProductUpdateService {

    private final ProductService productService;
    private final ScraperService scraperService;

    /**
     * Asynchronously updates prices for all monitored products in parallel.
     * This method is non-blocking and will execute in a background thread pool.
     */
    @Async
    public void updateAllProductsAsync() {
        List<Product> products = productService.getAllProducts();

        if (products.isEmpty()) {
            log.info("[ASYNC] No products to update.");
            return;
        }

        log.info("[ASYNC] Starting parallel price update for {} products.", products.size());

        // Step 1: Create a map of product ID to product
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        // Step 2: Asynchronously scrape all products in parallel
        List<CompletableFuture<ScrapeResponse>> futures = products.stream()
                .map(product -> scraperService.fetchProductData(product.getUrl())
                        .thenApply(scrapeResponse -> {
                            // Attach product ID to the response for context
                            if (scrapeResponse != null) {
                                scrapeResponse.setProductIdForUpdate(product.getId());
                            }
                            return scrapeResponse;
                        }))
                .collect(Collectors.toList());

        // Step 3: Wait for all scraping operations to complete
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]));

        // Step 4: Process the results once all are complete
        allFutures.thenAccept(v -> {
            long successCount = 0;
            long failCount = 0;

            for (CompletableFuture<ScrapeResponse> future : futures) {
                try {
                    ScrapeResponse scrapeData = future.get(); // .get() is safe here because allOf() is complete
                    if (scrapeData != null && scrapeData.getProductIdForUpdate() != null) {
                        Product product = productMap.get(scrapeData.getProductIdForUpdate());
                        if (product != null) {
                            // Each update is in its own transaction
                            productService.updateSingleProduct(product, scrapeData);
                            successCount++;
                        } else {
                            log.error("[ASYNC] Product not found in map for ID: {}", scrapeData.getProductIdForUpdate());
                            failCount++;
                        }
                    } else {
                        failCount++;
                    }
                } catch (Exception e) {
                    log.error("[ASYNC] Error processing a scrape result: {}", e.getMessage());
                    failCount++;
                }
            }
            log.info("[ASYNC] Parallel price update complete. Success: {}, Failed: {}", successCount, failCount);
        }).exceptionally(ex -> {
            log.error("[ASYNC] A critical error occurred during the parallel update process.", ex);
            return null;
        });
    }
}
