package com.mercadolivre.pricemonitor.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade para armazenar tokens OAuth do Mercado Livre.
 * Permite persistir tokens entre reinícios do servidor.
 */
@Entity
@Table(name = "ml_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MercadoLivreToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @Column(name = "token_type")
    private String tokenType;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "user_id_ml")
    private Long userIdMl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Verifica se o token ainda é válido.
     */
    public boolean isValid() {
        return accessToken != null && expiresAt != null && LocalDateTime.now().isBefore(expiresAt);
    }

    /**
     * Verifica se o token vai expirar em breve (5 minutos).
     */
    public boolean isExpiringSoon() {
        if (expiresAt == null) return true;
        return LocalDateTime.now().plusMinutes(5).isAfter(expiresAt);
    }
}
