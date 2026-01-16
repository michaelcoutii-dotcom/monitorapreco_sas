package com.mercadolivre.pricemonitor.service;

import com.mercadolivre.pricemonitor.model.MercadoLivreToken;
import com.mercadolivre.pricemonitor.repository.MercadoLivreTokenRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Serviço para integração com a API do Mercado Livre.
 * Usa OAuth2 para autenticação e consulta dados de produtos.
 * Tokens são persistidos no banco de dados.
 */
@Service
public class MercadoLivreService {

    @Value("${mercadolivre.client.id}")
    private String clientId;

    @Value("${mercadolivre.client.secret}")
    private String clientSecret;

    @Value("${mercadolivre.redirect.uri}")
    private String redirectUri;

    @Value("${mercadolivre.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;
    private final MercadoLivreTokenRepository tokenRepository;

    // Cache em memória para evitar queries constantes
    private MercadoLivreToken cachedToken;

    public MercadoLivreService(MercadoLivreTokenRepository tokenRepository) {
        this.restTemplate = new RestTemplate();
        this.tokenRepository = tokenRepository;
    }

    /**
     * Carrega token do banco ao iniciar.
     */
    @PostConstruct
    public void init() {
        loadTokenFromDatabase();
    }

    /**
     * Carrega o token mais recente do banco de dados.
     */
    private void loadTokenFromDatabase() {
        Optional<MercadoLivreToken> tokenOpt = tokenRepository.findLatestToken();
        if (tokenOpt.isPresent()) {
            cachedToken = tokenOpt.get();
            if (cachedToken.isValid()) {
                System.out.println("[ML_API] ✅ Token carregado do banco de dados!");
            } else if (cachedToken.getRefreshToken() != null) {
                System.out.println("[ML_API] ⚠️ Token expirado, tentando renovar...");
                try {
                    refreshAccessToken();
                } catch (Exception e) {
                    System.err.println("[ML_API] ❌ Falha ao renovar token: " + e.getMessage());
                    cachedToken = null;
                }
            }
        } else {
            System.out.println("[ML_API] ℹ️ Nenhum token encontrado no banco. Autorização necessária.");
        }
    }

    /**
     * Gera a URL para o usuário autorizar o app.
     */
    public String getAuthorizationUrl() {
        return UriComponentsBuilder.fromHttpUrl("https://auth.mercadolivre.com.br/authorization")
                .queryParam("response_type", "code")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .build()
                .toUriString();
    }

    /**
     * Troca o código de autorização por um access token.
     */
    public Map<String, Object> exchangeCodeForToken(String code) {
        String tokenUrl = apiUrl + "/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.Collections.singletonList(MediaType.APPLICATION_JSON));

        Map<String, String> body = new HashMap<>();
        body.put("grant_type", "authorization_code");
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("code", code);
        body.put("redirect_uri", redirectUri);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> tokenData = response.getBody();
                
                // Salvar no banco de dados
                saveTokenToDatabase(tokenData);
                
                System.out.println("[ML_API] ✅ Token obtido e salvo no banco!");
                return tokenData;
            }
        } catch (Exception e) {
            System.err.println("[ML_API] ❌ Erro ao obter token: " + e.getMessage());
            throw new RuntimeException("Falha ao obter token do Mercado Livre: " + e.getMessage());
        }

        return null;
    }

    /**
     * Salva ou atualiza o token no banco de dados.
     */
    private void saveTokenToDatabase(Map<String, Object> tokenData) {
        String accessToken = (String) tokenData.get("access_token");
        String refreshToken = (String) tokenData.get("refresh_token");
        String tokenType = (String) tokenData.get("token_type");
        Integer expiresIn = (Integer) tokenData.get("expires_in");
        Object userIdObj = tokenData.get("user_id");
        Long userId = userIdObj != null ? Long.valueOf(userIdObj.toString()) : null;

        LocalDateTime expiresAt = expiresIn != null 
            ? LocalDateTime.now().plusSeconds(expiresIn) 
            : LocalDateTime.now().plusHours(6);

        // Buscar token existente ou criar novo
        MercadoLivreToken token = tokenRepository.findLatestToken()
                .orElse(new MercadoLivreToken());

        token.setAccessToken(accessToken);
        token.setRefreshToken(refreshToken);
        token.setTokenType(tokenType);
        token.setExpiresAt(expiresAt);
        token.setUserIdMl(userId);

        cachedToken = tokenRepository.save(token);
    }

    /**
     * Renova o access token usando o refresh token.
     */
    public void refreshAccessToken() {
        if (cachedToken == null || cachedToken.getRefreshToken() == null) {
            throw new RuntimeException("Refresh token não disponível. Faça login novamente.");
        }

        String tokenUrl = apiUrl + "/oauth/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("grant_type", "refresh_token");
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("refresh_token", cachedToken.getRefreshToken());

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> tokenData = response.getBody();
                saveTokenToDatabase(tokenData);
                System.out.println("[ML_API] ✅ Token renovado e salvo no banco!");
            }
        } catch (Exception e) {
            System.err.println("[ML_API] ❌ Erro ao renovar token: " + e.getMessage());
            throw new RuntimeException("Falha ao renovar token: " + e.getMessage());
        }
    }

    /**
     * Busca informações de um produto pelo ID.
     */
    public Map<String, Object> getProduct(String itemId) {
        ensureValidToken();

        String url = apiUrl + "/items/" + itemId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(cachedToken.getAccessToken());

        HttpEntity<?> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            }
        } catch (Exception e) {
            System.err.println("[ML_API] ❌ Erro ao buscar produto: " + e.getMessage());
        }

        return null;
    }

    /**
     * Busca informações de um produto pela URL.
     * Extrai o ID da URL e consulta a API.
     */
    public Map<String, Object> getProductByUrl(String url) {
        String itemId = extractItemId(url);
        if (itemId == null) {
            throw new RuntimeException("Não foi possível extrair o ID do produto da URL");
        }
        return getProduct(itemId);
    }

    /**
     * Extrai o ID do produto da URL do Mercado Livre.
     */
    private String extractItemId(String url) {
        // Padrão: /p/MLB12345678
        java.util.regex.Pattern pattern1 = java.util.regex.Pattern.compile("/p/(ML[A-Z]\\d+)");
        java.util.regex.Matcher matcher1 = pattern1.matcher(url);
        if (matcher1.find()) {
            return matcher1.group(1);
        }

        // Padrão: MLB-1234567890 ou MLB1234567890
        java.util.regex.Pattern pattern2 = java.util.regex.Pattern.compile("(ML[A-Z])-?(\\d+)");
        java.util.regex.Matcher matcher2 = pattern2.matcher(url);
        if (matcher2.find()) {
            return matcher2.group(1) + matcher2.group(2);
        }

        return null;
    }

    /**
     * Garante que o token está válido, renovando se necessário.
     */
    private void ensureValidToken() {
        if (cachedToken == null || cachedToken.getAccessToken() == null) {
            throw new RuntimeException("Token não disponível. Faça login primeiro.");
        }

        // Renovar se vai expirar em breve
        if (cachedToken.isExpiringSoon()) {
            refreshAccessToken();
        }
    }

    /**
     * Verifica se há um token válido.
     */
    public boolean hasValidToken() {
        if (cachedToken == null) {
            loadTokenFromDatabase();
        }
        return cachedToken != null && cachedToken.isValid();
    }

    /**
     * Retorna o Client ID para uso no frontend.
     */
    public String getClientId() {
        return clientId;
    }

    /**
     * Retorna a URL de redirect.
     */
    public String getRedirectUri() {
        return redirectUri;
    }
}
