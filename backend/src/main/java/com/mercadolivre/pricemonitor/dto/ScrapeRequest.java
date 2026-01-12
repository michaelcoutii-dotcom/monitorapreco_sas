package com.mercadolivre.pricemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for the request sent to the Python scraper API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScrapeRequest {
    private String url;
}
