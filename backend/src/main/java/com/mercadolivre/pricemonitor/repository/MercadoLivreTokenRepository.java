package com.mercadolivre.pricemonitor.repository;

import com.mercadolivre.pricemonitor.model.MercadoLivreToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository para tokens OAuth do Mercado Livre.
 */
@Repository
public interface MercadoLivreTokenRepository extends JpaRepository<MercadoLivreToken, Long> {

    /**
     * Busca o token mais recente.
     */
    @Query("SELECT t FROM MercadoLivreToken t ORDER BY t.updatedAt DESC LIMIT 1")
    Optional<MercadoLivreToken> findLatestToken();

    /**
     * Busca token por user ID do Mercado Livre.
     */
    Optional<MercadoLivreToken> findByUserIdMl(Long userIdMl);
}
