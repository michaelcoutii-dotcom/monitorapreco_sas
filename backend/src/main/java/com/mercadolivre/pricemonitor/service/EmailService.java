package com.mercadolivre.pricemonitor.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for sending email notifications using Gmail SMTP.
 */
@Service
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${mail.from.name:MonitoraPreço}")
    private String fromName;

    @Value("${mail.from.email}")
    private String fromEmail;

    /**
     * Send a price drop notification email to a specific user.
     * Enhanced with competitive intelligence context.
     */
    public void sendPriceDropNotification(String userEmail, String productName, String productUrl, 
                                          Double oldPrice, Double newPrice) {
        if (userEmail == null || userEmail.isBlank()) {
            log.debug("No user email configured");
            return;
        }

        double savings = oldPrice - newPrice;
        double percentDrop = (savings / oldPrice) * 100;
        
        // Determinar urgência baseado na queda
        String urgencyBadge;
        String urgencyColor;
        if (percentDrop >= 20) {
            urgencyBadge = "🔥 OFERTA IMPERDÍVEL";
            urgencyColor = "#dc3545";
        } else if (percentDrop >= 10) {
            urgencyBadge = "⚡ GRANDE DESCONTO";
            urgencyColor = "#fd7e14";
        } else {
            urgencyBadge = "💰 PREÇO BAIXOU";
            urgencyColor = "#28a745";
        }

        String subject = String.format("🔻 Preço caiu %.0f%%! %s", percentDrop, truncate(productName, 35));
        
        String htmlBody = String.format("""
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a;">
                <!-- Header com urgência -->
                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 25px; border-radius: 12px 12px 0 0;">
                    <div style="background: %s; display: inline-block; padding: 6px 12px; border-radius: 20px; margin-bottom: 10px;">
                        <span style="color: white; font-size: 12px; font-weight: bold;">%s</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Seu concorrente reduziu o preço!</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Detectado agora pelo MonitoraPreço</p>
                </div>
                
                <!-- Corpo principal -->
                <div style="background: #1e293b; padding: 25px; border: 1px solid #334155;">
                    <h2 style="color: #f1f5f9; margin-top: 0; font-size: 18px;">%s</h2>
                    
                    <!-- Card de preço destacado -->
                    <div style="background: linear-gradient(135deg, #1e3a5f 0%%, #0f172a 100%%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #3b82f6;">
                        <table style="width: 100%%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;">
                                    <span style="color: #94a3b8; font-size: 13px;">Preço anterior:</span><br>
                                    <span style="text-decoration: line-through; color: #64748b; font-size: 18px;">R$ %.2f</span>
                                </td>
                                <td style="text-align: right; padding: 8px 0;">
                                    <span style="color: #94a3b8; font-size: 13px;">Novo preço:</span><br>
                                    <span style="color: #22c55e; font-size: 28px; font-weight: bold;">R$ %.2f</span>
                                </td>
                            </tr>
                        </table>
                        
                        <div style="background: #22c55e; padding: 12px; border-radius: 8px; margin-top: 15px; text-align: center;">
                            <span style="color: white; font-size: 16px; font-weight: bold;">
                                💸 Economia de R$ %.2f (%.1f%% OFF)
                            </span>
                        </div>
                    </div>
                    
                    <!-- Alerta competitivo -->
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>⚡ Ação recomendada:</strong> Ajuste seu preço para manter competitividade no Mercado Livre.
                        </p>
                    </div>
                    
                    <!-- Botão CTA -->
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%%, #2563eb 100%%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                            Ver Produto no ML →
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #0f172a; color: #64748b; padding: 20px; border-radius: 0 0 12px 12px; font-size: 12px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="margin: 0;">📊 MonitoraPreço - Inteligência Competitiva para Mercado Livre</p>
                    <p style="margin: 8px 0 0 0; color: #475569;">Monitoramento automático 24/7 dos seus concorrentes</p>
                </div>
            </div>
            """,
            urgencyColor,
            urgencyBadge,
            productName,
            oldPrice,
            newPrice,
            savings,
            percentDrop,
            productUrl
        );

        sendEmail(userEmail, subject, htmlBody);
    }

    /**
     * Send a price increase notification email to a specific user.
     * Enhanced with competitive opportunity context.
     */
    public void sendPriceIncreaseNotification(String userEmail, String productName, String productUrl,
                                              Double oldPrice, Double newPrice) {
        if (userEmail == null || userEmail.isBlank()) {
            log.debug("No user email configured");
            return;
        }

        double increase = newPrice - oldPrice;
        double percentIncrease = (increase / oldPrice) * 100;

        String subject = String.format("📈 Concorrente subiu preço +%.0f%%! %s", percentIncrease, truncate(productName, 30));
        
        String htmlBody = String.format("""
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); padding: 25px; border-radius: 12px 12px 0 0;">
                    <div style="background: #22c55e; display: inline-block; padding: 6px 12px; border-radius: 20px; margin-bottom: 10px;">
                        <span style="color: white; font-size: 12px; font-weight: bold;">💡 OPORTUNIDADE</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 22px;">📈 Concorrente subiu o preço!</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Detectado agora pelo MonitoraPreço</p>
                </div>
                
                <!-- Corpo principal -->
                <div style="background: #1e293b; padding: 25px; border: 1px solid #334155;">
                    <h2 style="color: #f1f5f9; margin-top: 0; font-size: 18px;">%s</h2>
                    
                    <!-- Card de preço -->
                    <div style="background: linear-gradient(135deg, #1e3a5f 0%%, #0f172a 100%%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #f59e0b;">
                        <table style="width: 100%%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0;">
                                    <span style="color: #94a3b8; font-size: 13px;">Preço anterior:</span><br>
                                    <span style="color: #22c55e; font-size: 18px;">R$ %.2f</span>
                                </td>
                                <td style="text-align: right; padding: 8px 0;">
                                    <span style="color: #94a3b8; font-size: 13px;">Novo preço:</span><br>
                                    <span style="color: #ef4444; font-size: 28px; font-weight: bold;">R$ %.2f</span>
                                </td>
                            </tr>
                        </table>
                        
                        <div style="background: #ef4444; padding: 12px; border-radius: 8px; margin-top: 15px; text-align: center;">
                            <span style="color: white; font-size: 16px; font-weight: bold;">
                                📈 Aumento de R$ %.2f (+%.1f%%)
                            </span>
                        </div>
                    </div>
                    
                    <!-- Alerta de oportunidade -->
                    <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                        <p style="margin: 0; color: #065f46; font-size: 14px;">
                            <strong>✅ Oportunidade:</strong> Seu concorrente está mais caro! Você pode ganhar mais vendas mantendo seu preço atual.
                        </p>
                    </div>
                    
                    <!-- Botão CTA -->
                    <div style="text-align: center; margin-top: 25px;">
                        <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                            Ver Produto no ML →
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #0f172a; color: #64748b; padding: 20px; border-radius: 0 0 12px 12px; font-size: 12px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="margin: 0;">📊 MonitoraPreço - Inteligência Competitiva para Mercado Livre</p>
                    <p style="margin: 8px 0 0 0; color: #475569;">Monitoramento automático 24/7 dos seus concorrentes</p>
                </div>
            </div>
            """,
            productName,
            oldPrice,
            newPrice,
            increase,
            percentIncrease,
            productUrl
        );

        sendEmail(userEmail, subject, htmlBody);
    }

    /**
     * Send an email using Gmail SMTP.
     */
    private void sendEmail(String to, String subject, String htmlBody) {
        try {
            log.info("📧 Iniciando envio de email para: {} via Gmail SMTP...", to);
            log.info("📧 [CONFIG] Host: smtp.gmail.com, FromEmail: {}, FromName: {}", fromEmail, fromName);
            
            if (fromEmail == null || fromEmail.isBlank() || fromEmail.contains("your-email")) {
                log.error("📧 ❌ ERRO: mail.from.email não está configurado corretamente: '{}'", fromEmail);
                return;
            }
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML
            
            mailSender.send(message);
            log.info("📧 ✅ Email enviado com SUCESSO para {}", to);

        } catch (MessagingException e) {
            log.error("📧 ❌ Erro MessagingException ao enviar email para {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            log.error("📧 ❌ Erro inesperado ao enviar email para {}: {} - {}", to, e.getClass().getSimpleName(), e.getMessage(), e);
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
     * Extract first name safely from full name.
     */
    private String getFirstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "Usuário";
        }
        String[] parts = fullName.trim().split(" ");
        return parts[0];
    }

    /**
     * Check if email service is enabled (always true with Gmail SMTP).
     */
    public boolean isEnabled() {
        return true;
    }

    /**
     * Send email verification link.
     * Runs asynchronously to not block user registration.
     */
    @Async
    public void sendVerificationEmail(String userEmail, String fullName, String verificationToken, String frontendUrl) {
        // Garantir que a URL base termina com /
        String baseUrl = frontendUrl.endsWith("/") ? frontendUrl : frontendUrl + "/";
        String verificationLink = baseUrl + "verify-email?token=" + verificationToken;
        
        // Sempre loga o link para debug
        log.info("📧 [DEBUG] Link de verificação: {}", verificationLink);

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
        log.info("📧 Verification email sent to {}", userEmail);
    }

    /**
     * Send password reset email.
     * Runs asynchronously to not block the request.
     */
    @Async
    public void sendPasswordResetEmail(String userEmail, String fullName, String resetToken, String frontendUrl) {
        String resetLink = frontendUrl + "reset-password?token=" + resetToken;
        
        // Sempre loga o link para debug
        log.info("🔑 [DEBUG] Link de reset de senha: {}", resetLink);

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
                        Recebemos uma solicitação para redefinir a senha da sua conta. 
                        Se foi você quem solicitou, clique no botão abaixo para criar uma nova senha:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%%, #d97706 100%%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            🔑 Redefinir Senha
                        </a>
                    </div>
                    
                    <p style="color: #888; font-size: 14px;">
                        Se o botão não funcionar, copie e cole este link no navegador:<br>
                        <a href="%s" style="color: #f59e0b; word-break: break-all;">%s</a>
                    </p>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px;">
                        <p style="color: #856404; font-size: 14px; margin: 0;">
                            ⚠️ <strong>Importante:</strong> Este link expira em <strong>1 hora</strong>.
                            Se você não solicitou esta recuperação, ignore este email - sua conta está segura.
                        </p>
                    </div>
                </div>
                
                <div style="background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 10px 10px; font-size: 12px; text-align: center;">
                    <p style="margin: 0;">Por segurança, nunca compartilhe este link com ninguém.</p>
                    <p style="margin: 10px 0 0 0; color: #64748b;">© 2024 MonitoraPreço - Todos os direitos reservados</p>
                </div>
            </div>
            """,
            fullName.split(" ")[0],
            resetLink,
            resetLink,
            resetLink
        );

        sendEmail(userEmail, subject, htmlBody);
        log.info("🔑 Password reset email sent to {}", userEmail);
    }

    /**
     * Send password reset code (6 digits).
     */
    public void sendPasswordResetCode(String userEmail, String fullName, String code) {
        log.info("🔑 [DEBUG] Código de recuperação: {}", code);

        String subject = "🔑 Código de Recuperação - MonitoraPreço";
        
        String htmlBody = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1e293b 0%%, #0f172a 100%%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: #f59e0b; margin: 0; font-size: 28px;">MonitoraPreço</h1>
                    <p style="color: #94a3b8; margin: 10px 0 0 0;">Recuperação de Senha</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
                    <h2 style="color: #333; margin-top: 0;">Olá, %s! 👋</h2>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Recebemos uma solicitação para redefinir sua senha. 
                        Use o código abaixo para continuar:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="display: inline-block; background: #1e293b; padding: 20px 40px; border-radius: 10px;">
                            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #f59e0b; letter-spacing: 8px;">%s</span>
                        </div>
                    </div>
                    
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 20px;">
                        <p style="color: #856404; font-size: 14px; margin: 0;">
                            ⏰ Este código expira em <strong>15 minutos</strong>.<br>
                            Se você não solicitou, ignore este email.
                        </p>
                    </div>
                </div>
                
                <div style="background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 10px 10px; font-size: 12px; text-align: center;">
                    <p style="margin: 0;">Por segurança, nunca compartilhe este código.</p>
                    <p style="margin: 10px 0 0 0; color: #64748b;">© %d MonitoraPreço</p>
                </div>
            </div>
            """,
            getFirstName(fullName),
            code,
            java.time.Year.now().getValue()
        );

        sendEmail(userEmail, subject, htmlBody);
        log.info("🔑 Password reset code sent to {}", userEmail);
    }
}
