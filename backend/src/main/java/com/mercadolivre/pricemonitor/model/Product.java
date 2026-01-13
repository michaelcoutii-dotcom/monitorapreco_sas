package com.mercadolivre.pricemonitor.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a monitored product from Mercado Livre.
 * 
 * Fields:
 * - id: Unique identifier
 * - name: Product title (extracted from scraping)
 * - url: Mercado Livre product URL
 * - imageUrl: Product image URL
 * - currentPrice: Latest scraped price
 * - lastPrice: Previous price (before last update)
 * - lastCheckedAt: Timestamp of last successful price check
 * - priceHistory: Historical prices for graphing
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

    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    @Column(name = "current_price")
    private Double currentPrice;

    @Column(name = "last_price")
    private Double lastPrice;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PriceHistory> priceHistory = new ArrayList<>();

    /**
     * Set creation timestamp before persisting.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
