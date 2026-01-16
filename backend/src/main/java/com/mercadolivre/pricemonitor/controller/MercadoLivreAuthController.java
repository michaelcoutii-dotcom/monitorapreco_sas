package com.mercadolivre.pricemonitor.controller;

import com.mercadolivre.pricemonitor.service.MercadoLivreService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     */
    @GetMapping("/authorize")
    public ResponseEntity<Map<String, String>> getAuthorizationUrl() {
        Map<String, String> response = new HashMap<>();
        response.put("authorizationUrl", mercadoLivreService.getAuthorizationUrl());
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
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription
    ) {
        // Se houve erro na autorização
        if (error != null) {
            System.err.println("[ML_OAUTH] Erro: " + error + " - " + errorDescription);
            return ResponseEntity.ok(buildRedirectHtml(
                    frontendUrl + "settings?ml_auth=error&message=" + errorDescription
            ));
        }

        // Se não veio código
        if (code == null || code.isEmpty()) {
            return ResponseEntity.ok(buildRedirectHtml(
                    frontendUrl + "settings?ml_auth=error&message=Código de autorização não recebido"
            ));
        }

        try {
            // Trocar o código pelo access token
            Map<String, Object> tokenData = mercadoLivreService.exchangeCodeForToken(code);

            if (tokenData != null) {
                System.out.println("[ML_OAUTH] ✅ Autorização concluída com sucesso!");
                
                // Redirecionar para o frontend com sucesso
                return ResponseEntity.ok(buildRedirectHtml(
                        frontendUrl + "settings?ml_auth=success"
                ));
            } else {
                return ResponseEntity.ok(buildRedirectHtml(
                        frontendUrl + "settings?ml_auth=error&message=Falha ao obter token"
                ));
            }

        } catch (Exception e) {
            System.err.println("[ML_OAUTH] Erro ao processar callback: " + e.getMessage());
            return ResponseEntity.ok(buildRedirectHtml(
                    frontendUrl + "settings?ml_auth=error&message=" + e.getMessage()
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
