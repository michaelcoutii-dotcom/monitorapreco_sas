package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.dto.RegisterRequest;
import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public User registerUser(RegisterRequest request) {
        log.info("📝 Registrando novo usuário: {}", request.getEmail());
        
        // Verificar se email já existe
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("⚠️ Email já registrado: {}", request.getEmail());
            throw new IllegalArgumentException("Email já está registrado");
        }
        
        // Criar novo usuário
        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        User savedUser = userRepository.save(user);
        log.info("✅ Usuário registrado com sucesso: id={}, email={}", savedUser.getId(), savedUser.getEmail());
        
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
