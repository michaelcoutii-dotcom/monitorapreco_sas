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

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
     * Para URLs do Mercado Livre, usa apenas a API oficial. Nunca usa o scraper Python.
     * Para outros sites, pode usar o scraper Python.
     *
     * @param productUrl The product URL.
     * @return A CompletableFuture containing the ScrapeResponse, or empty if an error occurs.
     */
    public CompletableFuture<ScrapeResponse> fetchProductData(String productUrl) {
        String cleanUrl = cleanMercadoLivreUrl(productUrl);
        log.info("🧹 URL limpa: {}", cleanUrl);

        // Detecta se é URL do Mercado Livre
        if (isMercadoLivreUrl(cleanUrl)) {
            if (mercadoLivreService.hasValidToken()) {
                log.info("🔑 Usando API oficial do Mercado Livre para: {}", cleanUrl);
                return fetchFromMercadoLivreApi(cleanUrl);
            } else {
                log.error("❌ Token Mercado Livre não disponível. Autorização necessária para buscar produto.");
                // Retorna erro claro para o frontend
                    return CompletableFuture.completedFuture(
                        new ScrapeResponse(null, null, null, null)
                    );
            }
        }

        // Para outros sites, usa o scraper Python normalmente
        log.info("🔧 Usando scraper Python para: {}", cleanUrl);
        return fetchFromPythonScraper(cleanUrl);
    }

    /**
     * Verifica se a URL é do Mercado Livre.
     */
    private boolean isMercadoLivreUrl(String url) {
        if (url == null) return false;
        return url.contains("mercadolivre.com.br") || url.contains("mercadolibre.com");
    }
    
    /**
     * Limpa a URL do Mercado Livre, removendo parâmetros de tracking e fragmentos.
     * Também corrige URLs duplicadas.
     */
    private String cleanMercadoLivreUrl(String url) {
        if (url == null || url.isEmpty()) {
            return url;
        }
        
        try {
            // Detectar e corrigir URL duplicada (se tiver https:// duas vezes)
            int firstHttps = url.indexOf("https://");
            int secondHttps = url.indexOf("https://", firstHttps + 1);
            if (secondHttps > 0) {
                url = url.substring(0, secondHttps);
                log.debug("URL duplicada corrigida");
            }
            
            // Remover fragmento (tudo depois de #)
            int hashIndex = url.indexOf('#');
            if (hashIndex > 0) {
                url = url.substring(0, hashIndex);
            }
            
            // Remover parâmetros de query (tudo depois de ?)
            int queryIndex = url.indexOf('?');
            if (queryIndex > 0) {
                url = url.substring(0, queryIndex);
            }
            
            return url.trim();
        } catch (Exception e) {
            log.warn("Erro ao limpar URL: {}", e.getMessage());
            return url;
        }
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