package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.ScrapeRequest;
import com.mercadolivre.pricemonitor.dto.ScrapeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Service responsible for communicating with the Python scraper API.
 * 
 * Handles:
 * - HTTP POST requests to the scraper
 * - Timeout handling
 * - Error logging (does not throw exceptions)
 */
@Service
@Slf4j
public class ScraperService {

    private final RestTemplate restTemplate;
    private final String scraperApiUrl;

    public ScraperService(@Value("${scraper.api.url}") String scraperApiUrl) {
        this.scraperApiUrl = scraperApiUrl;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Fetch product data from the Python scraper API.
     * 
     * @param productUrl The Mercado Livre product URL to scrape
     * @return ScrapeResponse with title and price, or null if scraping fails
     */
    public ScrapeResponse fetchProductData(String productUrl) {
        String endpoint = scraperApiUrl + "/scrape";
        
        log.debug("Calling scraper API for URL: {}", productUrl);
        
        try {
            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Prepare request body
            ScrapeRequest request = new ScrapeRequest(productUrl);
            HttpEntity<ScrapeRequest> entity = new HttpEntity<>(request, headers);
            
            // Make POST request with timeout handling
            ResponseEntity<ScrapeResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                entity,
                ScrapeResponse.class
            );
            
            // Check if response is successful
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                ScrapeResponse result = response.getBody();
                log.debug("Scraper returned: title='{}', price={}", result.getTitle(), result.getPrice());
                return result;
            } else {
                log.warn("Scraper returned non-success status: {}", response.getStatusCode());
                return null;
            }
            
        } catch (RestClientException e) {
            // Handle HTTP errors, timeouts, connection refused, etc.
            log.error("Failed to call scraper API for URL '{}': {}", productUrl, e.getMessage());
            return null;
        } catch (Exception e) {
            // Catch any unexpected errors
            log.error("Unexpected error while calling scraper API: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Check if the scraper API is available.
     * 
     * @return true if the API responds, false otherwise
     */
    public boolean isScraperAvailable() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(scraperApiUrl, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Scraper API is not available: {}", e.getMessage());
            return false;
        }
    }
}
