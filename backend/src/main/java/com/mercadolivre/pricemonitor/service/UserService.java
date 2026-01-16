package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.RegisterRequest;
import com.mercadolivre.pricemonitor.model.User;
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
        
        // Enviar email de verificação
        try {
            emailService.sendVerificationEmail(
                savedUser.getEmail(),
                savedUser.getFullName(),
                verificationToken,
                frontendUrl
            );
            log.info("📧 Email de verificação enviado para: {}", savedUser.getEmail());
        } catch (Exception e) {
            log.error("❌ Erro ao enviar email de verificação: {}", e.getMessage());
            // Não falha o registro se o email não for enviado
        }
        
        return savedUser;
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
}
