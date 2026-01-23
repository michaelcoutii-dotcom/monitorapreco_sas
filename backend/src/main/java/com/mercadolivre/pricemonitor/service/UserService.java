package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.RegisterRequest;
import com.mercadolivre.pricemonitor.model.Notification;
import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.NotificationRepository;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ResendEmailService resendEmailService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Value("${frontend.url:http://localhost:5173/}")
    private String frontendUrl;
    
    public User registerUser(RegisterRequest request) {
        log.info("📝 Registrando novo usuário: {}", request.getEmail());
        
        // Verificar se email já existe
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("⚠️ Email já registrado: {}", request.getEmail());
            throw new IllegalArgumentException("Email já está registrado");
        }
        
        // Gerar token de verificação
        String verificationToken = UUID.randomUUID().toString();
        
        // Criar novo usuário
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(false);
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpires(LocalDateTime.now().plusHours(24));
        
        User savedUser = userRepository.save(user);
        log.info("✅ Usuário registrado com sucesso: id={}, email={}", savedUser.getId(), savedUser.getEmail());
        
        // Criar notificação de boas-vindas pedindo para verificar o email
        try {
            createWelcomeNotification(savedUser);
        } catch (Exception e) {
            log.error("❌ Erro ao criar notificação de boas-vindas: {}", e.getMessage());
        }
        
        // Enviar email de verificação (usa Resend se configurado, senão Gmail SMTP)
        try {
            if (resendEmailService.isConfigured()) {
                log.info("📧 Usando Resend API para enviar email");
                resendEmailService.sendVerificationEmail(
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    verificationToken,
                    frontendUrl
                );
            } else {
                log.info("📧 Usando Gmail SMTP para enviar email");
                emailService.sendVerificationEmail(
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    verificationToken,
                    frontendUrl
                );
            }
            log.info("📧 Email de verificação enviado para: {}", savedUser.getEmail());
        } catch (Exception e) {
            log.error("❌ Erro ao enviar email de verificação: {}", e.getMessage());
            // Não falha o registro se o email não for enviado
        }
        
        return savedUser;
    }

    /**
     * Cria notificação de boas-vindas pedindo para verificar o email
     */
    private void createWelcomeNotification(User user) {
        Notification notification = new Notification();
        notification.setUserId(user.getId());
        notification.setType(Notification.NotificationType.SYSTEM);
        notification.setMessage(
            "📧 Bem-vindo ao MonitoraPreço! Confirme seu email para desbloquear todos os recursos. " +
            "Clique em Configurações → Verificar Email"
        );
        notification.setIsRead(false);
        notificationRepository.save(notification);
        log.info("🔔 Notificação de boas-vindas criada para usuário: {}", user.getEmail());
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    /**
     * Inicia o processo de recuperação de senha - envia código de 6 dígitos
     */
    public void initiatePasswordReset(String email) {
        log.info("🔑 Iniciando recuperação de senha para: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email não encontrado"));
        
        // Gerar código de 6 dígitos
        String resetCode = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setResetPasswordToken(resetCode);
        user.setResetPasswordTokenExpires(LocalDateTime.now().plusMinutes(15)); // Expira em 15 minutos
        
        userRepository.save(user);
        
        // Enviar email com código
        try {
            emailService.sendPasswordResetCode(
                user.getEmail(),
                user.getFullName(),
                resetCode
            );
            log.info("📧 Código de recuperação enviado para: {}", email);
        } catch (Exception e) {
            log.error("❌ Erro ao enviar código de recuperação: {}", e.getMessage());
            throw new RuntimeException("Erro ao enviar email de recuperação");
        }
    }

    /**
     * Valida o código de reset e retorna o email do usuário
     */
    public String validateResetCode(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email não encontrado"));
        
        if (user.getResetPasswordToken() == null || !user.getResetPasswordToken().equals(code)) {
            throw new IllegalArgumentException("Código inválido");
        }
        
        if (user.getResetPasswordTokenExpires().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado. Solicite um novo código.");
        }
        
        return user.getEmail();
    }

    /**
     * Reseta a senha do usuário usando email e código
     */
    public void resetPassword(String email, String code, String newPassword) {
        log.info("🔑 Resetando senha para: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Email não encontrado"));
        
        if (user.getResetPasswordToken() == null || !user.getResetPasswordToken().equals(code)) {
            throw new IllegalArgumentException("Código inválido");
        }
        
        if (user.getResetPasswordTokenExpires().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Código expirado. Solicite um novo código.");
        }
        
        // Atualizar senha
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpires(null);
        
        userRepository.save(user);
        log.info("✅ Senha resetada com sucesso para: {}", user.getEmail());
    }
}
