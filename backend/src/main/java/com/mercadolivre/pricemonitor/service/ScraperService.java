package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.ScrapeRequest;
import com.mercadolivre.pricemonitor.dto.ScrapeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

/**
 * Service responsible for communicating with the Python scraper API.
 * Uses a non-blocking WebClient for asynchronous communication.
 */
@Service
@Slf4j
public class ScraperService {

    private final WebClient webClient;
    private final String scraperApiUrl;

    public ScraperService(@Value("${scraper.api.url}") String scraperApiUrl) {
        this.scraperApiUrl = scraperApiUrl;
        this.webClient = WebClient.builder()
                .baseUrl(scraperApiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("ScraperService initialized with WebClient for URL: {}", scraperApiUrl);
    }

    /**
     * Asynchronously fetches product data from the Python scraper API.
     *
     * @param productUrl The Mercado Livre product URL to scrape.
     * @return A CompletableFuture containing the ScrapeResponse, or empty if an error occurs.
     */
    public CompletableFuture<ScrapeResponse> fetchProductData(String productUrl) {
        String endpoint = "/scrape";
        log.debug("Calling async scraper API: {} | Product URL: {}", scraperApiUrl + endpoint, productUrl);

        ScrapeRequest request = new ScrapeRequest(productUrl);

        long startTime = System.currentTimeMillis();

        return webClient.post()
                .uri(endpoint)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ScrapeResponse.class)
                .doOnSuccess(response -> {
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("✅ Async Scraper success: title='{}' | price=R${} | duration={}ms",
                            response.getTitle(), response.getPrice(), duration);
                })
                .doOnError(error -> log.error("❌ Async Scraper API error for URL '{}': {}", productUrl, error.getMessage()))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1)).maxAttempts(3)) // Optional: simple retry logic
                .onErrorResume(e -> Mono.empty()) // On error, return an empty Mono instead of an exception
                .toFuture(); // Convert the Mono to a CompletableFuture
    }

    /**
     * Asynchronously checks if the scraper API is available.
     *
     * @return A CompletableFuture containing true if the API is available, false otherwise.
     */
    public CompletableFuture<Boolean> isScraperAvailable() {
        return webClient.get()
                .uri("/")
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> true)
                .doOnSuccess(available -> log.info("✅ Async Scraper API is available"))
                .doOnError(error -> log.error("❌ Async Scraper API is NOT available at {}: {}", scraperApiUrl, error.getMessage()))
                .onErrorReturn(false)
                .toFuture();
    }
}