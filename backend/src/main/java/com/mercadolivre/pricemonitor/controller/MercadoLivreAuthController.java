package com.mercadolivre.pricemonitor.controller;

import com.mercadolivre.pricemonitor.service.MercadoLivreService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller para integração OAuth com o Mercado Livre.
 */
@RestController
@RequestMapping("/api/auth/mercadolivre")
public class MercadoLivreAuthController {

    private final MercadoLivreService mercadoLivreService;

    @Value("${frontend.url}")
    private String frontendUrl;

    public MercadoLivreAuthController(MercadoLivreService mercadoLivreService) {
        this.mercadoLivreService = mercadoLivreService;
    }

    /**
     * Retorna a URL para iniciar o fluxo de autorização OAuth.
     * Inclui o userId do usuário logado no state parameter.
     */
    @GetMapping("/authorize")
    public ResponseEntity<Map<String, String>> getAuthorizationUrl() {
        // Pegar userId do usuário autenticado
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long userId = null;
        if (auth != null && auth.getPrincipal() instanceof Long) {
            userId = (Long) auth.getPrincipal();
        }
        
        // Gerar state com userId codificado
        String state = userId != null 
            ? Base64.getEncoder().encodeToString(("userId:" + userId).getBytes(StandardCharsets.UTF_8))
            : "";
        
        Map<String, String> response = new HashMap<>();
        response.put("authorizationUrl", mercadoLivreService.getAuthorizationUrl(state));
        response.put("clientId", mercadoLivreService.getClientId());
        return ResponseEntity.ok(response);
    }

    /**
     * Callback do OAuth - recebe o código de autorização do ML.
     * O ML redireciona para esta URL após o usuário autorizar.
     */
    @GetMapping("/callback")
    public ResponseEntity<String> handleCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription
    ) {
        // Se houve erro na autorização
        if (error != null) {
            System.err.println("[ML_OAUTH] Erro: " + error + " - " + errorDescription);
            String encodedMsg = URLEncoder.encode(errorDescription != null ? errorDescription : error, StandardCharsets.UTF_8);
            return ResponseEntity.ok(buildRedirectHtml(
                    frontendUrl + "/settings?ml_auth=error&message=" + encodedMsg
            ));
        }

        // Se não veio código
        if (code == null || code.isEmpty()) {
            return ResponseEntity.ok(buildRedirectHtml(
                    frontendUrl + "/settings?ml_auth=error&message=Código+de+autorização+não+recebido"
            ));
        }

        try {
            // Trocar o código pelo access token (salva automaticamente no banco)
            Map<String, Object> tokenData = mercadoLivreService.exchangeCodeForToken(code);
            
            if (tokenData != null) {
                System.out.println("[ML_OAUTH] ✅ Autorização concluída com sucesso!");
                return ResponseEntity.ok(buildRedirectHtml(
                        frontendUrl + "/settings?ml_auth=success"
                ));
            } else {
                return ResponseEntity.ok(buildRedirectHtml(
                        frontendUrl + "/settings?ml_auth=error&message=Falha+ao+obter+token"
                ));
            }
        } catch (Exception e) {
            System.err.println("[ML_OAUTH] Erro ao processar callback: " + e.getMessage());
            String encodedMsg = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            return ResponseEntity.ok(buildRedirectHtml(
                    frontendUrl + "/settings?ml_auth=error&message=" + encodedMsg
            ));
        }
    }

    /**
     * Verifica o status da conexão com o ML.
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("connected", mercadoLivreService.hasValidToken());
        return ResponseEntity.ok(response);
    }

    /**
     * Gera HTML que redireciona para o frontend.
     */
    private String buildRedirectHtml(String url) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta http-equiv='refresh' content='0;url=" + url + "'>" +
                "<script>window.location.href='" + url + "';</script>" +
                "</head>" +
                "<body>" +
                "<p>Redirecionando...</p>" +
                "<a href='" + url + "'>Clique aqui se não for redirecionado</a>" +
                "</body>" +
                "</html>";
    }
}
