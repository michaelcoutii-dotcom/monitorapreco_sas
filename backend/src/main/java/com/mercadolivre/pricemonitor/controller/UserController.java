package com.mercadolivre.pricemonitor.controller;

import com.mercadolivre.pricemonitor.dto.ChangePasswordRequest;
import com.mercadolivre.pricemonitor.dto.UpdateProfileRequest;
import com.mercadolivre.pricemonitor.model.User;
import com.mercadolivre.pricemonitor.repository.PriceHistoryRepository;
import com.mercadolivre.pricemonitor.repository.ProductRepository;
import com.mercadolivre.pricemonitor.repository.UserRepository;
import com.mercadolivre.pricemonitor.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Atualizar perfil do usuário (nome)
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
        try {
            Long userId = getCurrentUserId();
            log.info("📝 Atualizando perfil do usuário: {}", userId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

            if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
                user.setFullName(request.getFullName().trim());
            }

            userRepository.save(user);
            log.info("✅ Perfil atualizado com sucesso: {}", userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Perfil atualizado com sucesso");
            response.put("fullName", user.getFullName());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro ao atualizar perfil: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erro ao atualizar perfil: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Erro ao atualizar perfil"));
        }
    }

    /**
     * Alterar senha do usuário
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            Long userId = getCurrentUserId();
            log.info("🔐 Alterando senha do usuário: {}", userId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

            // Validar senha atual
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                log.warn("⚠️ Senha atual incorreta para usuário: {}", userId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(errorResponse("Senha atual incorreta"));
            }

            // Validar nova senha
            if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(errorResponse("A nova senha deve ter pelo menos 6 caracteres"));
            }

            // Atualizar senha
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            log.info("✅ Senha alterada com sucesso: {}", userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Senha alterada com sucesso");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro ao alterar senha: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erro ao alterar senha: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Erro ao alterar senha"));
        }
    }

    /**
     * Excluir conta do usuário (LGPD compliance)
     */
    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<?> deleteAccount() {
        try {
            Long userId = getCurrentUserId();
            log.info("🗑️ Iniciando exclusão da conta do usuário: {}", userId);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

            // Excluir histórico de preços dos produtos do usuário
            log.info("📊 Excluindo histórico de preços...");
            priceHistoryRepository.deleteByProductUserId(userId);

            // Excluir produtos do usuário
            log.info("📦 Excluindo produtos...");
            productRepository.deleteByUserId(userId);

            // Excluir usuário
            log.info("👤 Excluindo conta...");
            userRepository.delete(user);

            log.info("✅ Conta excluída com sucesso: {}", userId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Conta excluída com sucesso");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erro ao excluir conta: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Erro ao excluir conta: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorResponse("Erro ao excluir conta"));
        }
    }

    /**
     * Obter ID do usuário autenticado
     */
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
