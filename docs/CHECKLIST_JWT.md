## ✅ Checklist - Autenticação JWT Implementada

### Backend (Java/Spring Boot)
- [x] Adicionar dependências (Spring Security + JJWT)
- [x] Criar entidade `User`
- [x] Criar `UserRepository` com queries customizadas
- [x] Criar `JwtTokenProvider` (geração e validação)
- [x] Criar `JwtAuthenticationFilter` (interceptador HTTP)
- [x] Criar `SecurityConfig` (configuração de segurança)
- [x] Criar `UserService` (lógica de negócio)
- [x] Criar `AuthController` (endpoints REST)
- [x] Adicionar `user_id` na tabela `products`
- [x] Atualizar `ProductService` para multi-tenant
- [x] Atualizar `ProductRepository` com queries por usuário
- [x] Atualizar `ProductController` para usar token
- [x] Adicionar config JWT em `application.properties`

### Frontend (React)
- [x] Adicionar dependência `react-router-dom`
- [x] Criar `AuthContext` com hooks
- [x] Criar componente `Login`
- [x] Criar componente `Register`
- [x] Criar componente `PrivateRoute`
- [x] Criar componente `Dashboard`
- [x] Restruturar `App.jsx` com roteamento
- [x] Atualizar `Header.jsx` com menu de usuário/logout
- [x] Integrar token em todas requisições `/api/**`

### Teste Manual
- [ ] Abrir frontend em http://localhost:5173
- [ ] Clicar em "Cadastre-se"
- [ ] Preencher: Nome, Email, Senha (min 6 chars), Confirmar Senha
- [ ] Verificar se foi criado e logado automaticamente
- [ ] Adicionar um produto
- [ ] Logout
- [ ] Fazer login novamente
- [ ] Verificar se produto ainda está lá (apenas seu)
- [ ] Testar busca e filtros

### Status de Compilação
- [ ] `npm install` no frontend OK
- [ ] `mvn clean package` no backend OK
- [ ] Backend rodando em http://localhost:8080
- [ ] Frontend rodando em http://localhost:5173
- [ ] Scraper rodando em http://localhost:8000 (se quiser testar produto)

---

## 🎯 Próximos Features Recomendados

Após testar autenticação:

1. **Alertas Customizados** (por queda % ou R$)
2. **Webhook para Slack/Discord**
3. **Refresh Tokens** (aumentar segurança)
4. **Dashboard com Estatísticas**
5. **Notificações Push**
6. **Dark Mode**
7. **Perfil do Usuário** (alterar email/senha)

---

## 📌 Notas Importantes

1. **JWT Secret**: Alterar `jwt.secret` em produção (use variável de ambiente)
2. **CORS**: Frontend está em localhost:5173, Backend permite em config
3. **Timeout**: Requisições com timeout (15s leitura, 30s scraping)
4. **Logs**: Use console para debug ([INFO], [SUCCESS], [ERROR], [WARN])
5. **localStorage**: Token persiste até logout ou expiração (24h)
