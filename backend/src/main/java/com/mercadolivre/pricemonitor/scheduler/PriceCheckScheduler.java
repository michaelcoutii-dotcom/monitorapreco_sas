package com.mercadolivre.pricemonitor.scheduler;

import com.mercadolivre.pricemonitor.service.ProductService;
import com.mercadolivre.pricemonitor.service.ScraperService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Scheduled task for periodic price checking.
 * 
 * Runs every 30 minutes and updates all product prices.
 * Uses a lock to prevent overlapping executions.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PriceCheckScheduler {

    private final ProductService productService;
    private final ScraperService scraperService;

    private static final DateTimeFormatter TIMESTAMP_FORMAT = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Lock to prevent concurrent executions.
     * If a previous job is still running, the new one will be skipped.
     */
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    /**
     * Scheduled task that runs every 30 minutes.
     * 
     * Cron: 0 0/30 * * * * = At second 0 of every 30th minute
     * 
     * Alternative fixed rate (uncomment to use):
     * @Scheduled(fixedRate = 1800000) // 30 minutes in milliseconds
     */
    @Scheduled(cron = "0 0/30 * * * *")
    public void checkPrices() {
        // Prevent overlapping executions
        if (!isRunning.compareAndSet(false, true)) {
            log.warn("Previous price check is still running. Skipping this execution.");
            return;
        }

        String startTime = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.info("========================================");
        log.info("🕐 Price check job STARTED at {}", startTime);
        log.info("========================================");

        try {
            // Check if scraper is available before proceeding
            if (!scraperService.isScraperAvailable()) {
                log.error("Scraper API is not available. Skipping price update.");
                return;
            }

            // Execute the price update
            productService.updateProductPrices();

        } catch (Exception e) {
            log.error("Price check job failed with error: {}", e.getMessage(), e);
        } finally {
            // Always release the lock
            isRunning.set(false);
            
            String endTime = LocalDateTime.now().format(TIMESTAMP_FORMAT);
            log.info("========================================");
            log.info("✅ Price check job FINISHED at {}", endTime);
            log.info("========================================");
        }
    }

    /**
     * Manual trigger for price check (useful for testing).
     * Can be called via a REST endpoint.
     */
    public void triggerManualCheck() {
        log.info("Manual price check triggered");
        checkPrices();
    }
}
