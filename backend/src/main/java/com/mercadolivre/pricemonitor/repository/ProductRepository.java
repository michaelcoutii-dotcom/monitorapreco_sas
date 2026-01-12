package com.mercadolivre.pricemonitor.repository;

import com.mercadolivre.pricemonitor.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JPA Repository for Product entity.
 * Provides CRUD operations and custom queries.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Find a product by its URL.
     */
    Optional<Product> findByUrl(String url);

    /**
     * Find all products where the current price is lower than the last price.
     * Useful for finding products with price drops.
     */
    @Query("SELECT p FROM Product p WHERE p.currentPrice < p.lastPrice")
    List<Product> findProductsWithPriceDrop();

    /**
     * Check if a product with the given URL already exists.
     */
    boolean existsByUrl(String url);
}
