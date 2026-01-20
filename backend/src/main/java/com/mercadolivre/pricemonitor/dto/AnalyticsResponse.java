package com.mercadolivre.pricemonitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for price analytics response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    
    // Resumo geral
    private Long totalChanges;
    private Integer totalProducts;
    private Double avgChangesPerDay;
    
    // Mudanças por dia (últimos 30 dias)
    private List<DailyChange> changesByDate;
    
    // Mudanças por hora do dia (0-23)
    private Map<Integer, Long> changesByHour;
    
    // Mudanças por dia da semana
    private Map<String, Long> changesByDayOfWeek;
    
    // Top produtos com mais mudanças
    private List<ProductChangeRank> topChangingProducts;
    
    // Horário mais comum de alteração
    private Integer peakHour;
    private String peakDayOfWeek;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyChange {
        private String date;
        private Long count;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductChangeRank {
        private Long productId;
        private String productName;
        private Long changeCount;
    }
}
