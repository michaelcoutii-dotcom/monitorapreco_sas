package com.mercadolivre.pricemonitor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Email service using Resend API (HTTP-based, works on Railway).
 * Resend is free for up to 3000 emails/month.
 */
@Service
@Slf4j
public class ResendEmailService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${resend.api.key:}")
    private String apiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${resend.from.name:MonitoraPreco}")
    private String fromName;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Check if Resend is configured
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals("your-resend-api-key");
    }

    /**
     * Send email via Resend API
     */
    public boolean sendEmail(String to, String subject, String htmlBody) {
        if (!isConfigured()) {
            log.warn("📧 [RESEND] API key não configurada, email não enviado");
            return false;
        }

        try {
            log.info("📧 [RESEND] Enviando email para: {}", to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("from", fromName + " <" + fromEmail + ">");
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
                log.info("📧 [RESEND] ✅ Email enviado com SUCESSO para {}", to);
                return true;
            } else {
                log.error("📧 [RESEND] ❌ Erro ao enviar email: {}", response.getBody());
                return false;
            }

        } catch (Exception e) {
            log.error("📧 [RESEND] ❌ Erro ao enviar email para {}: {}", to, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Send verification email
     */
    @Async
    public void sendVerificationEmail(String userEmail, String fullName, String verificationToken, String frontendUrl) {
        try {
            log.info("📧 [RESEND] Iniciando envio de email de verificação para: {}", userEmail);
            
            String baseUrl = frontendUrl.endsWith("/") ? frontendUrl : frontendUrl + "/";
            String verificationLink = baseUrl + "verify-email?token=" + verificationToken;
            
            log.info("📧 [RESEND] Link de verificação: {}", verificationLink);

            String subject = "✉️ Confirme seu email - MonitoraPreço";
            
            String htmlBody = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e293b 0%%, #0f172a 100%%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: #f59e0b; margin: 0; font-size: 28px;">MonitoraPreço</h1>
                        <p style="color: #94a3b8; margin: 10px 0 0 0;">Inteligência Competitiva</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Olá, %s! 👋</h2>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            Obrigado por se cadastrar no MonitoraPreço! Para ativar sua conta e começar a monitorar seus concorrentes, confirme seu email clicando no botão abaixo:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                ✉️ Confirmar Email
                            </a>
                        </div>
                        
                        <p style="color: #888; font-size: 14px;">
                            Se o botão não funcionar, copie e cole este link no navegador:<br>
                            <a href="%s" style="color: #f59e0b; word-break: break-all;">%s</a>
                        </p>
                        
                        <p style="color: #888; font-size: 13px; margin-top: 20px;">
                            ⏰ Este link expira em 24 horas.
                        </p>
                    </div>
                    
                    <div style="background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 10px 10px; font-size: 12px; text-align: center;">
                        <p style="margin: 0;">Se você não criou esta conta, ignore este email.</p>
                        <p style="margin: 10px 0 0 0; color: #64748b;">© %d MonitoraPreço - Todos os direitos reservados</p>
                    </div>
                </div>
                """,
                getFirstName(fullName),
                verificationLink,
                verificationLink,
                verificationLink,
                java.time.Year.now().getValue()
            );

            sendEmail(userEmail, subject, htmlBody);
            
        } catch (Exception e) {
            log.error("📧 [RESEND] ❌ Erro ao enviar email de verificação para {}: {}", userEmail, e.getMessage(), e);
        }
    }

    /**
     * Send password reset email
     */
    @Async
    public void sendPasswordResetEmail(String userEmail, String fullName, String resetToken, String frontendUrl) {
        try {
            log.info("🔑 [RESEND] Iniciando envio de email de reset para: {}", userEmail);
            
            String resetLink = frontendUrl + "reset-password?token=" + resetToken;
            
            log.info("🔑 [RESEND] Link de reset: {}", resetLink);

            String subject = "🔑 Recuperação de Senha - MonitoraPreço";
            
            String htmlBody = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #1e293b 0%%, #0f172a 100%%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: #f59e0b; margin: 0; font-size: 28px;">MonitoraPreço</h1>
                        <p style="color: #94a3b8; margin: 10px 0 0 0;">Recuperação de Senha</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Olá, %s! 👋</h2>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                🔑 Redefinir Senha
                            </a>
                        </div>
                        
                        <p style="color: #888; font-size: 14px;">
                            Se o botão não funcionar, copie e cole este link:<br>
                            <a href="%s" style="color: #f59e0b; word-break: break-all;">%s</a>
                        </p>
                        
                        <p style="color: #888; font-size: 13px; margin-top: 20px;">
                            ⏰ Este link expira em 1 hora.
                        </p>
                    </div>
                    
                    <div style="background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 10px 10px; font-size: 12px; text-align: center;">
                        <p style="margin: 0;">Se você não solicitou isso, ignore este email.</p>
                    </div>
                </div>
                """,
                getFirstName(fullName),
                resetLink,
                resetLink,
                resetLink
            );

            sendEmail(userEmail, subject, htmlBody);
            
        } catch (Exception e) {
            log.error("🔑 [RESEND] ❌ Erro ao enviar email de reset para {}: {}", userEmail, e.getMessage(), e);
        }
    }

    private String getFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "Usuário";
        }
        return fullName.trim().split(" ")[0];
    }
}
