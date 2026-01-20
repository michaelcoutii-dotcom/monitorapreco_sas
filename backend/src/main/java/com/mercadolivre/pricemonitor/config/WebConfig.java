package com.mercadolivre.pricemonitor.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            // Development
            .allowedOrigins(
                "http://localhost",           // Docker (Nginx on port 80)
                "http://localhost:80",        // Explicit port 80
                "http://localhost:5173",      // Vite dev server
                "http://localhost:3000",      // Alternative dev port
                "http://127.0.0.1",
                "http://127.0.0.1:80",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
            )
            // Production - remover localhost antes de deploy!
            // .allowedOrigins("https://seu-dominio.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "X-Requested-With", "accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers")
            .exposedHeaders("Authorization", "Content-Type")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
