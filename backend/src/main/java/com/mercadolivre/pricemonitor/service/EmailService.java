package com.mercadolivre.pricemonitor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for sending email notifications using Resend API.
 * 
 * Resend is a modern email API that's easy to use and has a generous free tier.
 * Free: 100 emails/day, 3000 emails/month
 */
@Service
@Slf4j
public class EmailService {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String fromEmail;
    private final String notificationEmail;
    private final boolean enabled;

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    public EmailService(
            @Value("${resend.api.key:}") String apiKey,
            @Value("${resend.from.email:onboarding@resend.dev}") String fromEmail,
            @Value("${notification.email:}") String notificationEmail) {
        
        this.restTemplate = new RestTemplate();
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.notificationEmail = notificationEmail;
        this.enabled = apiKey != null && !apiKey.isBlank();
        
        if (enabled) {
            log.info("📧 Email service initialized. Notifications will be sent to: {}", notificationEmail);
        } else {
            log.warn("📧 Email service disabled. Set resend.api.key to enable notifications.");
        }
    }

    /**
     * Send a price drop notification email.
     */
    public void sendPriceDropNotification(String productName, String productUrl, 
                                          Double oldPrice, Double newPrice) {
        if (!enabled || notificationEmail == null || notificationEmail.isBlank()) {
            log.debug("Email notifications disabled or no recipient configured");
            return;
        }

        double savings = oldPrice - newPrice;
        double percentDrop = (savings / oldPrice) * 100;

        String subject = String.format("🔻 Preço caiu! %s", truncate(productName, 40));
        
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🔻 Alerta de Preço!</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
                    <h2 style="color: #333; margin-top: 0;">%s</h2>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p style="margin: 5px 0; color: #666;">
                            <strong>Preço anterior:</strong> 
                            <span style="text-decoration: line-through; color: #999;">R$ %.2f</span>
                        </p>
                        <p style="margin: 5px 0;">
                            <strong>Novo preço:</strong> 
                            <span style="color: #28a745; font-size: 24px; font-weight: bold;">R$ %.2f</span>
                        </p>
                        <p style="margin: 5px 0; color: #28a745;">
                            <strong>Você economiza:</strong> R$ %.2f (%.1f%% off)
                        </p>
                    </div>
                    
                    <a href="%s" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Ver no Mercado Livre →
                    </a>
                </div>
                
                <div style="background: #333; color: #999; padding: 15px; border-radius: 0 0 10px 10px; font-size: 12px; text-align: center;">
                    Price Monitor - Mercado Livre
                </div>
            </div>
            """,
            productName,
            oldPrice,
            newPrice,
            savings,
            percentDrop,
            productUrl
        );

        sendEmail(notificationEmail, subject, htmlBody);
    }

    /**
     * Send an email using Resend API.
     */
    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", fromEmail);
            body.put("to", List.of(to));
            body.put("subject", subject);
            body.put("html", htmlBody);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                RESEND_API_URL,
                HttpMethod.POST,
                request,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("📧 Email sent successfully to {}", to);
            } else {
                log.error("📧 Failed to send email. Status: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("📧 Error sending email: {}", e.getMessage());
        }
    }

    /**
     * Truncate string for email subject.
     */
    private String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }

    /**
     * Check if email service is enabled.
     */
    public boolean isEnabled() {
        return enabled;
    }
}
