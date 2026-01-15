package com.mercadolivre.pricemonitor.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for the response received from the Python scraper API.
 *
 * Example:
 * {
 *   "title": "Produto Nome",
 *   "price": 1234.56,
 *   "imageUrl": "https://..."
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScrapeResponse {
    
    @JsonProperty("title")
    private String title;
    
    @JsonProperty("price")
    private Double price;
    
    @JsonProperty("imageUrl")
    private String imageUrl;

    /**
     * Internal field used to track which product this response belongs to during async updates.
     * It is not part of the JSON response from the scraper.
     */
    @JsonIgnore
    private Long productIdForUpdate;

    @Override
    public String toString() {
        return "ScrapeResponse{" +
                "title='" + title + '\'' +
                ", price=" + price +
                ", imageUrl='" + imageUrl + '\'' +
                '}';
    }

    public boolean isValid() {
        return title != null && !title.isBlank() && price != null && price > 0;
    }
}

