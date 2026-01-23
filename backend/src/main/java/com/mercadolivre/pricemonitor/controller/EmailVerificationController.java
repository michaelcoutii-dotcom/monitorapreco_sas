package com.mercadolivre.pricemonitor.controller;

import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import com.mercadolivre.pricemonitor.service.EmailService;
import com.mercadolivre.pricemonitor.service.ResendEmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
public class EmailVerificationController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ResendEmailService resendEmailService;

    @Value("${frontend.url:http://localhost:5173/}")
    private String frontendUrl;
    private String frontendUrl;

    /**
     * Verify email with token
     */
    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            log.info("📧 Verificando token de email: {}", token.substring(0, 8) + "...");

            var userOpt = userRepository.findByVerificationToken(token);
            
            if (userOpt.isEmpty()) {
                // Token not found - might be already verified or invalid
                log.info("📧 Token não encontrado - pode já ter sido usado");
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Email já verificado anteriormente!");
                response.put("alreadyVerified", true);
                return ResponseEntity.ok(response);
            }
            
            User user = userOpt.get();

            // Check if token expired
            if (user.getVerificationTokenExpires() != null && 
                user.getVerificationTokenExpires().isBefore(LocalDateTime.now())) {
                log.warn("⚠️ Token expirado para usuário: {}", user.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(errorResponse("Token expirado. Solicite um novo email de verificação."));
            }

            // Verify email
            user.setEmailVerified(true);
            user.setVerificationToken(null);
            user.setVerificationTokenExpires(null);
            userRepository.save(user);

            log.info("✅ Email verificado com sucesso: {}", user.getEmail());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Email verificado com sucesso!");
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro na verificação: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erro ao verificar email: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Erro ao verificar email"));
        }
    }

    /**
     * Resend verification email
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification() {
        try {
            Long userId = getCurrentUserId();
            log.info("📧 Reenviando email de verificação para usuário: {}", userId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

            if (user.getEmailVerified()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(errorResponse("Email já está verificado"));
            }

            // Generate new token
            String token = UUID.randomUUID().toString();
            user.setVerificationToken(token);
            user.setVerificationTokenExpires(LocalDateTime.now().plusHours(24));
            userRepository.save(user);

            // Send email (usa Resend se configurado, senão Gmail SMTP)
            if (resendEmailService.isConfigured()) {
                log.info("📧 Usando Resend API para enviar email");
                resendEmailService.sendVerificationEmail(
                    user.getEmail(),
                    user.getFullName(),
                    token,
                    frontendUrl
                );
            } else {
                log.info("📧 Usando Gmail SMTP para enviar email");
                emailService.sendVerificationEmail(
                    user.getEmail(),
                    user.getFullName(),
                    token,
                    frontendUrl
                );
            }

            log.info("✅ Email de verificação reenviado para: {}", user.getEmail());

            Map<String, String> response = new HashMap<>();
            response.put("message", "Email de verificação enviado com sucesso!");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro ao reenviar: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erro ao reenviar verificação: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Erro ao reenviar email"));
        }
    }

    /**
     * Get email verification status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getVerificationStatus() {
        try {
            Long userId = getCurrentUserId();

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

            Map<String, Object> response = new HashMap<>();
            response.put("emailVerified", user.getEmailVerified());
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Erro ao obter status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Erro ao obter status"));
        }
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalArgumentException("Usuário não autenticado");
        }
        return (Long) auth.getPrincipal();
    }

    private Map<String, String> errorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
