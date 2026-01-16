package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.ScrapeRequest;
import com.mercadolivre.pricemonitor.dto.ScrapeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service responsible for fetching product data.
 * Uses Mercado Livre API when OAuth token is available,
 * falls back to Python scraper otherwise.
 */
@Service
@Slf4j
public class ScraperService {

    private final WebClient webClient;
    private final String scraperApiUrl;
    private final MercadoLivreService mercadoLivreService;

    @Autowired
    public ScraperService(
            @Value("${scraper.api.url}") String scraperApiUrl,
            MercadoLivreService mercadoLivreService) {
        this.scraperApiUrl = scraperApiUrl;
        this.mercadoLivreService = mercadoLivreService;
        this.webClient = WebClient.builder()
                .baseUrl(scraperApiUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        log.info("ScraperService initialized with WebClient for URL: {}", scraperApiUrl);
    }

    /**
     * Asynchronously fetches product data.
     * Uses ML API if OAuth token is available, otherwise falls back to Python scraper.
     *
     * @param productUrl The Mercado Livre product URL.
     * @return A CompletableFuture containing the ScrapeResponse, or empty if an error occurs.
     */
    public CompletableFuture<ScrapeResponse> fetchProductData(String productUrl) {
        // Tentar usar a API oficial do ML primeiro
        if (mercadoLivreService.hasValidToken()) {
            log.info("🔑 Usando API oficial do Mercado Livre para: {}", productUrl);
            return fetchFromMercadoLivreApi(productUrl);
        }
        
        // Fallback para o scraper Python
        log.info("🔧 Usando scraper Python para: {}", productUrl);
        return fetchFromPythonScraper(productUrl);
    }

    /**
     * Fetches product data from ML official API.
     */
    private CompletableFuture<ScrapeResponse> fetchFromMercadoLivreApi(String productUrl) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                long startTime = System.currentTimeMillis();
                Map<String, Object> productData = mercadoLivreService.getProductByUrl(productUrl);
                
                if (productData != null) {
                    String title = (String) productData.get("title");
                    Object priceObj = productData.get("price");
                    Double price = priceObj != null ? Double.valueOf(priceObj.toString()) : null;
                    
                    // Buscar imagem
                    String imageUrl = null;
                    Object pictures = productData.get("pictures");
                    if (pictures instanceof java.util.List && !((java.util.List<?>) pictures).isEmpty()) {
                        Object firstPic = ((java.util.List<?>) pictures).get(0);
                        if (firstPic instanceof Map) {
                            imageUrl = (String) ((Map<?, ?>) firstPic).get("url");
                        }
                    }
                    if (imageUrl == null) {
                        imageUrl = (String) productData.get("thumbnail");
                    }
                    
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("✅ ML API success: title='{}' | price=R${} | duration={}ms",
                            title, price, duration);
                    
                    return new ScrapeResponse(title, price, imageUrl, null);
                }
            } catch (Exception e) {
                log.error("❌ ML API error: {} - Falling back to scraper", e.getMessage());
            }
            
            // Se falhou, tentar com o scraper
            log.warn("⚠️ ML API falhou, tentando scraper Python...");
            return fetchFromPythonScraper(productUrl).join();
        });
    }

    /**
     * Fetches product data from Python scraper API.
     */
    private CompletableFuture<ScrapeResponse> fetchFromPythonScraper(String productUrl) {
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
                    log.info("✅ Scraper success: title='{}' | price=R${} | duration={}ms",
                            response.getTitle(), response.getPrice(), duration);
                })
                .doOnError(error -> log.error("❌ Scraper API error for URL '{}': {}", productUrl, error.getMessage()))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1))
                        .maxAttempts(3)
                        .doBeforeRetry(signal -> log.warn("🔄 Retry attempt {}/3 for URL: {}", 
                            signal.totalRetries() + 1, productUrl))
                )
                .onErrorResume(e -> {
                    log.error("❌ Scraper failed after 3 retry attempts for URL: {}", productUrl);
                    return Mono.empty();
                })
                .toFuture();
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