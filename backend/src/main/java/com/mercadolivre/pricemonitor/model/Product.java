package com.mercadolivre.pricemonitor.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a monitored product from Mercado Livre.
 * 
 * Fields:
 * - id: Unique identifier
 * - name: Product title (extracted from scraping)
 * - url: Mercado Livre product URL
 * - currentPrice: Latest scraped price
 * - lastPrice: Previous price (before last update)
 * - lastCheckedAt: Timestamp of last successful price check
 */
@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 2048)
    private String url;

    @Column(name = "current_price")
    private Double currentPrice;

    @Column(name = "last_price")
    private Double lastPrice;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Set creation timestamp before persisting.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
