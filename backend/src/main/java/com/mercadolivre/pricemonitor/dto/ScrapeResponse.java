package com.mercadolivre.pricemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for the response received from the Python scraper API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScrapeResponse {
    private String title;
    private Double price;
}
