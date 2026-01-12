package com.mercadolivre.pricemonitor.repository;

import com.mercadolivre.pricemonitor.model.PriceHistory;
import com.mercadolivre.pricemonitor.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    
    List<PriceHistory> findByProductOrderByRecordedAtDesc(Product product);
    
    List<PriceHistory> findTop30ByProductOrderByRecordedAtDesc(Product product);
    
    void deleteByProduct(Product product);
}
