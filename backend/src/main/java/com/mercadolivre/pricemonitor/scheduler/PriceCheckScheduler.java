package com.mercadolivre.pricemonitor.scheduler;

import com.mercadolivre.pricemonitor.service.AsyncProductUpdateService;
import com.mercadolivre.pricemonitor.service.ScraperService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Scheduled task for periodic price checking.
 * Triggers the asynchronous update service in a non-blocking manner.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PriceCheckScheduler {

    private final AsyncProductUpdateService asyncProductUpdateService;
    private final ScraperService scraperService;

    private static final DateTimeFormatter TIMESTAMP_FORMAT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Scheduled task that runs every 30 minutes.
     * This implementation is fully non-blocking.
     */
    @Scheduled(cron = "0 0/30 * * * *")
    public void checkPrices() {
        String startTime = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        log.info("========================================");
        log.info("🕐 Triggering ASYNC Price Check Job at {}", startTime);
        log.info("========================================");

        scraperService.isScraperAvailable().thenAcceptAsync(isAvailable -> {
            if (isAvailable) {
                log.info("✅ Scraper is available. Triggering async price update process.");
                asyncProductUpdateService.updateAllProductsAsync();
            } else {
                log.error("❌ Scraper API is not available. Skipping price update trigger.");
            }
        }).exceptionally(ex -> {
            log.error("Failed to check scraper availability: {}", ex.getMessage());
            return null;
        });

        log.info("Scheduler has finished its work for this cycle and released the thread.");
    }

    /**
     * Manual trigger for the price check.
     */
    public void triggerManualCheck() {
        log.info("Manual async price check triggered");
        checkPrices();
    }
}
