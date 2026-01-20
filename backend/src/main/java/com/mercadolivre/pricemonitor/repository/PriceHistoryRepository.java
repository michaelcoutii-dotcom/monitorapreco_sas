package com.mercadolivre.pricemonitor.repository;

import com.mercadolivre.pricemonitor.model.PriceHistory;
import com.mercadolivre.pricemonitor.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    // Buscar todos os IDs de histórico ordenados por produto e data
    @Query("SELECT ph FROM PriceHistory ph ORDER BY ph.product.id, ph.recordedAt ASC")
    List<PriceHistory> findAllOrderByProductAndDate();
    
    // Deletar por lista de IDs
    @Transactional
    @Modifying
    @Query("DELETE FROM PriceHistory ph WHERE ph.id IN :ids")
    int deleteByIds(@Param("ids") List<Long> ids);

    // Analytics queries - Só contam mudanças REAIS (preço diferente do anterior, ignora primeiro registro)
    
    // Histórico de um produto nos últimos N dias
    @Query("SELECT ph FROM PriceHistory ph WHERE ph.product.id = :productId AND ph.recordedAt >= :since ORDER BY ph.recordedAt ASC")
    List<PriceHistory> findByProductIdSince(@Param("productId") Long productId, @Param("since") LocalDateTime since);
    
    // Total de mudanças por produto do usuário (só conta mudanças reais - ignora primeiro registro)
    @Query(value = "SELECT ph.product_id, p.name, COUNT(*) as changes FROM price_history ph " +
           "JOIN products p ON ph.product_id = p.id " +
           "INNER JOIN price_history ph_prev ON ph.product_id = ph_prev.product_id AND ph_prev.id = (" +
           "  SELECT MAX(ph2.id) FROM price_history ph2 WHERE ph2.product_id = ph.product_id AND ph2.id < ph.id" +
           ") " +
           "WHERE p.user_id = :userId AND ph.recorded_at >= :since " +
           "AND ph.price != ph_prev.price " +
           "GROUP BY ph.product_id, p.name ORDER BY changes DESC", nativeQuery = true)
    List<Object[]> countChangesByProductForUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    // Mudanças por hora do dia (0-23) - só mudanças reais
    @Query(value = "SELECT HOUR(ph.recorded_at) as hour, COUNT(*) as count FROM price_history ph " +
           "JOIN products p ON ph.product_id = p.id " +
           "INNER JOIN price_history ph_prev ON ph.product_id = ph_prev.product_id AND ph_prev.id = (" +
           "  SELECT MAX(ph2.id) FROM price_history ph2 WHERE ph2.product_id = ph.product_id AND ph2.id < ph.id" +
           ") " +
           "WHERE p.user_id = :userId AND ph.recorded_at >= :since " +
           "AND ph.price != ph_prev.price " +
           "GROUP BY HOUR(ph.recorded_at) ORDER BY hour", nativeQuery = true)
    List<Object[]> countChangesByHourForUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    // Mudanças por dia da semana (1=DOM, 7=SAB) - só mudanças reais
    @Query(value = "SELECT DAYOFWEEK(ph.recorded_at) as dayOfWeek, COUNT(*) as count FROM price_history ph " +
           "JOIN products p ON ph.product_id = p.id " +
           "INNER JOIN price_history ph_prev ON ph.product_id = ph_prev.product_id AND ph_prev.id = (" +
           "  SELECT MAX(ph2.id) FROM price_history ph2 WHERE ph2.product_id = ph.product_id AND ph2.id < ph.id" +
           ") " +
           "WHERE p.user_id = :userId AND ph.recorded_at >= :since " +
           "AND ph.price != ph_prev.price " +
           "GROUP BY DAYOFWEEK(ph.recorded_at) ORDER BY dayOfWeek", nativeQuery = true)
    List<Object[]> countChangesByDayOfWeekForUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    // Mudanças por data - só mudanças reais
    @Query(value = "SELECT DATE(ph.recorded_at) as date, COUNT(*) as count FROM price_history ph " +
           "JOIN products p ON ph.product_id = p.id " +
           "INNER JOIN price_history ph_prev ON ph.product_id = ph_prev.product_id AND ph_prev.id = (" +
           "  SELECT MAX(ph2.id) FROM price_history ph2 WHERE ph2.product_id = ph.product_id AND ph2.id < ph.id" +
           ") " +
           "WHERE p.user_id = :userId AND ph.recorded_at >= :since " +
           "AND ph.price != ph_prev.price " +
           "GROUP BY DATE(ph.recorded_at) ORDER BY date", nativeQuery = true)
    List<Object[]> countChangesByDateForUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    // Total de mudanças do usuário - só mudanças reais (ignora primeiro registro de cada produto)
    @Query(value = "SELECT COUNT(*) FROM price_history ph " +
           "JOIN products p ON ph.product_id = p.id " +
           "INNER JOIN price_history ph_prev ON ph.product_id = ph_prev.product_id AND ph_prev.id = (" +
           "  SELECT MAX(ph2.id) FROM price_history ph2 WHERE ph2.product_id = ph.product_id AND ph2.id < ph.id" +
           ") " +
           "WHERE p.user_id = :userId AND ph.recorded_at >= :since " +
           "AND ph.price != ph_prev.price", nativeQuery = true)
    Long countTotalChangesForUser(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
