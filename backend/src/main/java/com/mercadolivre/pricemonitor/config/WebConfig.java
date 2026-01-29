package com.mercadolivre.pricemonitor.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> allowedOrigins = new ArrayList<>();
        
        // Development origins
        allowedOrigins.add("http://localhost");
        allowedOrigins.add("http://localhost:80");
        allowedOrigins.add("http://localhost:5173");
        allowedOrigins.add("http://localhost:3000");
        allowedOrigins.add("http://127.0.0.1");
        allowedOrigins.add("http://127.0.0.1:80");
        allowedOrigins.add("http://127.0.0.1:5173");
        allowedOrigins.add("http://127.0.0.1:3000");
        
        // Production origin from environment variable
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            // Add the URL as-is
            allowedOrigins.add(frontendUrl.trim());
            
            // Remove trailing slash if present
            String cleanUrl = frontendUrl.trim();
            if (cleanUrl.endsWith("/")) {
                cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
                allowedOrigins.add(cleanUrl);
            }
            
            // Add both HTTP and HTTPS versions for Railway
            if (cleanUrl.startsWith("https://")) {
                allowedOrigins.add(cleanUrl.replace("https://", "http://"));
            } else if (cleanUrl.startsWith("http://")) {
                allowedOrigins.add(cleanUrl.replace("http://", "https://"));
            }
        }
        
        // Railway wildcard support (common Railway domains)
        allowedOrigins.add("https://*.railway.app");
        allowedOrigins.add("https://*.up.railway.app");
        
        log.info("🌐 CORS allowed origins: {}", allowedOrigins);
        
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.toArray(new String[0]))
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD")
            .allowedHeaders("*")
            .exposedHeaders("Authorization", "Content-Type")
            .allowCredentials(true)
            .maxAge(3600);
        
        // Also allow actuator endpoints
        registry.addMapping("/actuator/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "OPTIONS")
            .allowedHeaders("*")
            .maxAge(3600);
    }
}
