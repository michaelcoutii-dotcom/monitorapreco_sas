package com.mercadolivre.pricemonitor.repository;

import com.mercadolivre.pricemonitor.model.PriceHistory;
import com.mercadolivre.pricemonitor.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    
    List<PriceHistory> findByProductOrderByRecordedAtDesc(Product product);
    
    List<PriceHistory> findTop30ByProductOrderByRecordedAtDesc(Product product);
    
    void deleteByProduct(Product product);

    @Transactional
    @Modifying
    @Query("DELETE FROM PriceHistory p WHERE p.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    @Transactional
    @Modifying
    @Query("DELETE FROM PriceHistory ph WHERE ph.product.id IN (SELECT p.id FROM Product p WHERE p.userId = :userId)")
    void deleteByProductUserId(@Param("userId") Long userId);
}
