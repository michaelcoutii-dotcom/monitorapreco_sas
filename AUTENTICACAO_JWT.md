# 🔐 Autenticação JWT - Price Monitor

## 📋 Resumo da Implementação

Foi implementado um sistema completo de autenticação com JWT (JSON Web Tokens) no Price Monitor:

### ✅ Backend (Java/Spring Boot)

**Dependências Adicionadas:**
- `spring-boot-starter-security` - Spring Security
- `jjwt` (v0.12.3) - JWT para Java

**Novas Classes Criadas:**
1. **`User.java`** - Entidade de usuário com campos:
   - `id`, `email`, `password`, `fullName`
   - Timestamps: `createdAt`, `updatedAt`

2. **`UserRepository.java`** - JPA Repository com métodos:
   - `findByEmail(String email)`
   - `existsByEmail(String email)`

3. **`JwtTokenProvider.java`** - Gerador e validador de tokens JWT
   - `generateToken(userId, email)` - Cria token válido por 24h
   - `validateToken(token)` - Valida assinatura do token
   - `getUserIdFromToken(token)` - Extrai userId do token

4. **`JwtAuthenticationFilter.java`** - Filtro HTTP
   - Extrai token do header `Authorization: Bearer <token>`
   - Valida e carrega usuário no SecurityContext

5. **`SecurityConfig.java`** - Configuração de segurança
   - Endpoints públicos: `/api/auth/register`, `/api/auth/login`
   - Endpoints protegidos: `/api/products/**` (requer token)
   - `BCryptPasswordEncoder` para hash seguro de senhas

6. **`UserService.java`** - Lógica de negócio
   - `registerUser()` - Valida email único, encripta senha
   - `findByEmail()`, `findById()`
   - `validatePassword()` - Compara senha com hash

7. **`AuthController.java`** - Endpoints REST
   - `POST /api/auth/register` - Registra novo usuário
   - `POST /api/auth/login` - Autentica e retorna token
   - `GET /api/auth/me` - Retorna dados do usuário logado

**Modificações em Classes Existentes:**
- **`Product.java`** - Adicionado campo `userId` (obrigatório)
- **`ProductController.java`** - Usa `userId` do token para filtrar produtos
- **`ProductService.java`** - Novos métodos:
  - `getProductsByUserId(Long userId)`
  - `addProduct(String url, Long userId)` 
- **`ProductRepository.java`** - Novas queries:
  - `findByUserId(Long userId)`
  - `findByUrlAndUserId(String url, Long userId)`

**Configuração (application.properties):**
```properties
jwt.secret=meu-super-secreto-jwt-key-que-deve-ser-muito-longo-para-seguranca
jwt.expiration=86400000  # 24 horas em millisegundos
```

---

### ✅ Frontend (React)

**Novas Dependências:**
- `react-router-dom` (v7.0.0) - Roteamento e proteção de rotas

**Componentes Criados:**

1. **`Login.jsx`** - Tela de login
   - Form com email/senha
   - Validação client-side
   - Chamada a `/api/auth/login`
   - Redirecionamento automático após sucesso

2. **`Register.jsx`** - Tela de cadastro
   - Form com nome/email/senha/confirmar senha
   - Validações (senha mínimo 6 chars, senhas iguais)
   - Chamada a `/api/auth/register`
   - Cria conta e faz login automático

3. **`AuthContext.jsx`** - Context de autenticação
   - Gerencia estado global: `user`, `token`
   - Métodos: `login()`, `logout()`
   - Persiste dados no localStorage
   - Restaura sessão ao recarregar página

4. **`PrivateRoute.jsx`** - Protetor de rotas
   - Redireciona para `/login` se sem token
   - Mostra loading enquanto verifica autenticação

**Componentes Atualizados:**

5. **`App.jsx`** - Restruturado com React Router
   - Rotas públicas: `/login`, `/register`
   - Rota protegida: `/` (Dashboard)
   - Fallback para `/` se rota desconhecida

6. **`Dashboard.jsx`** - Conteúdo principal autenticado
   - Mesmo comportamento anterior
   - Usa `Authorization: Bearer <token>` em todas requisições
   - Filtra produtos por `userId` do token

7. **`Header.jsx`** - Atualizado
   - Menu de usuário com dropdown
   - Botão de logout
   - Mostra nome e email do usuário

---

## 🚀 Como Usar

### Backend

1. **Compilar projeto:**
```bash
cd backend
bash compilar-e-executar.sh
```

2. **Backend inicia em** `http://localhost:8080`

### Frontend

1. **Instalar dependências:**
```bash
cd frontend
npm install
```

2. **Iniciar dev server:**
```bash
npm run dev
```

3. **Frontend está em** `http://localhost:5173`

### Fluxo de Uso

1. **Primeira vez:**
   - Acesse `http://localhost:5173`
   - Clique em "Cadastre-se"
   - Preencha nome, email, senha (mín. 6 chars)
   - Será redirecionado automaticamente ao dashboard

2. **Próximos acessos:**
   - Acesse `http://localhost:5173`
   - Clique em "Faça login"
   - Use email e senha cadastrados
   - Dashboard mostra apenas seus produtos

3. **Logout:**
   - Clique na foto/inicial do usuário (canto superior direito)
   - Clique em "Sair"
   - Redirecionado para `/login`

---

## 🔑 Como Funciona o JWT

### Autenticação:
1. Usuário envia `email` e `senha` para `/api/auth/login`
2. Backend valida senha com BCrypt
3. Se OK, gera JWT assinado com secret key (válido 24h)
4. Frontend recebe token e armazena no localStorage
5. Todas requisições incluem: `Authorization: Bearer <token>`

### Autorização:
1. `JwtAuthenticationFilter` intercepta cada requisição
2. Extrai token do header `Authorization`
3. Valida assinatura com secret key
4. Se válido, extrai `userId` e carrega no SecurityContext
5. Controllers acessam `userId` do token

### Segurança:
- Senhas: Hash com `BCrypt` (não reversível)
- Token: Assinado com `HMAC-SHA512` + secret key
- Expiração: 24 horas
- Secret key: Deve ser alterada em produção!

---

## 📊 Estrutura de Dados

### User (Banco de Dados)
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### Product (Modificado)
```sql
ALTER TABLE products ADD COLUMN user_id BIGINT NOT NULL;
```

---

## 🔒 Próximos Passos

- [ ] Alterar `jwt.secret` para valor seguro em produção
- [ ] Implementar refresh tokens
- [ ] Adicionar autenticação de 2 fatores (2FA)
- [ ] Integração com OAuth (Google, GitHub)
- [ ] Rate limiting por usuário
- [ ] Auditoria de acessos

---

## 📝 Logs de Referência

**Login bem-sucedido:**
```
[INFO] 🔐 Recebido request de login: user@example.com
[SUCCESS] ✅ Login bem-sucedido: user@example.com
[INFO] 🔓 Usuário logado: user@example.com
```

**Produto adicionado por usuário:**
```
[INFO] ➕ Adding new product for userId: 1, URL: https://...
[SUCCESS] ✅ Added new product for userId 1: 'Produto X' at R$ 199.90
```

**Token validado:**
```
[DEBUG] ✅ Usuário autenticado: userId=1, email=user@example.com
```

---

## ⚠️ Troubleshooting

**"401 Unauthorized"** - Token inválido ou expirado
- Solução: Fazer logout e login novamente

**"403 Forbidden"** - Tentando acessar produto de outro usuário
- Solução: Cada usuário só vê seus próprios produtos

**"Produto já existe"** - URL já foi adicionada por este usuário
- Solução: Produtos são únicos por user + URL

