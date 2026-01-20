# 🎯 Price Monitor - Espião de Preços do Mercado Livre

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Java](https://img.shields.io/badge/Java-17-orange.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Python](https://img.shields.io/badge/Python-3.11-yellow.svg)

**Sistema completo de monitoramento de preços de concorrentes no Mercado Livre.**

*Monitore seus concorrentes 24/7 e receba alertas quando os preços mudarem!*

</div>

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Screenshots](#-screenshots)
- [Arquitetura](#-arquitetura)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Deploy](#-deploy)
- [Roadmap](#-roadmap)

---

## ✨ Funcionalidades

### 🔍 Monitoramento de Produtos
- ✅ Adicione produtos do Mercado Livre via URL
- ✅ Extração automática de nome, preço e imagem
- ✅ Limite de produtos por plano (5 gratuito / ilimitado premium)
- ✅ Atualização automática de preços a cada 30 minutos

### 📊 Histórico de Preços
- ✅ Gráfico visual de evolução de preços
- ✅ Registro de todas as mudanças com data/hora
- ✅ Indicadores de tendência (subiu/desceu)

### 🔔 Sistema de Notificações
- ✅ **Telegram** - Alertas instantâneos via bot (@monitoraprecoalert_bot)
- ✅ **Email** - Receba alertas por email quando preços mudarem
- ✅ **In-App (Sininho)** - Notificações dentro do sistema
- ✅ Configuração por produto (queda/aumento)
- ✅ Preferências personalizáveis

### 📊 Analytics Avançado
- ✅ Dashboard completo com métricas
- ✅ Gráficos de evolução de preços
- ✅ Histórico detalhado com timestamps
- ✅ Indicadores de tendência (subiu/desceu)

### 👤 Gestão de Usuários
- ✅ Registro com verificação de email
- ✅ Login seguro com JWT
- ✅ Recuperação de senha por email
- ✅ Perfil do usuário

### 🎓 Experiência do Usuário
- ✅ Tutorial de onboarding para novos usuários
- ✅ Interface moderna e responsiva (tema escuro)
- ✅ Toasts de feedback em todas as ações
- ✅ Modal de confirmação para ações destrutivas

---

## 📸 Screenshots

| Dashboard | Histórico de Preços | Configurar Alertas |
|-----------|--------------------|--------------------|
| Lista de produtos monitorados | Gráfico de evolução | Preferências por produto |

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│                   React 19 + Vite + Tailwind                │
│                      (porta 5173)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
│                   Java 17 + Spring Boot 3.2                 │
│                      (porta 8081)                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Products │  │  Notify  │  │ WhatsApp │   │
│  │Controller│  │Controller│  │Controller│  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Services                           │  │
│  │  UserService │ ProductService │ EmailService │ JWT   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│      DATABASE       │       │       SCRAPER       │
│   MySQL 8 / H2      │       │   Python + FastAPI  │
│                     │       │    + Playwright     │
│  • users            │       │    (porta 8000)     │
│  • products         │       │                     │
│  • price_history    │       │  Extrai dados do    │
│  • notifications    │       │  Mercado Livre      │
└─────────────────────┘       └─────────────────────┘
```

### 📁 Estrutura de Pastas

```
sas_mercado_livre/
├── backend/                    # Java Spring Boot
│   ├── src/main/java/com/mercadolivre/pricemonitor/
│   │   ├── config/            # SecurityConfig, WebConfig
│   │   ├── controller/        # REST Controllers
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── model/             # Entities (User, Product, etc)
│   │   ├── repository/        # JPA Repositories
│   │   ├── scheduler/         # Cron Jobs
│   │   ├── security/          # JWT Filter
│   │   └── service/           # Business Logic
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── api/               # API calls
│   │   ├── components/        # React Components
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # Custom Hooks
│   │   └── utils/             # Utilities
│   └── index.html
│
├── scraper/                    # Python FastAPI
│   ├── main.py                # FastAPI server
│   ├── scraper.py             # Playwright scraper
│   └── requirements.txt
│
├── docker-compose.yml
└── README.md
```

---

## 📋 Requisitos

### 🐳 Para Rodar com Docker (Recomendado)

| Requisito | Versão |
|-----------|--------|
| Docker Desktop | 4.0+ |

**Só isso!** Não precisa instalar Java, Node.js, Python ou MySQL.

### Para Desenvolvimento Local

| Requisito | Versão |
|-----------|--------|
| Java | 21+ |
| Maven | 3.8+ |
| Node.js | 20+ |
| Python | 3.11+ |
| MySQL | 8.0 (ou H2 para dev) |

---

## 🚀 Instalação Rápida (Docker)

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/sas_mercado_livre.git
cd sas_mercado_livre
```

### 2. Execute o Script de Inicialização

**Windows:**
```batch
iniciar.bat
```

**Linux/Mac:**
```bash
chmod +x iniciar.sh
./iniciar.sh
```

**Ou manualmente:**
```bash
docker-compose up -d --build
```

### 3. Acesse o Sistema

| Serviço | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost |
| ⚙️ Backend API | http://localhost:8081 |
| 🔍 Scraper API | http://localhost:8000 |
| 🗄️ MySQL | localhost:3307 |

### 4. Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Parar todos os containers
docker-compose down

# Reiniciar um serviço específico
docker-compose restart backend

# Ver status dos containers
docker-compose ps
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Backend (application.properties ou variáveis de ambiente)
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/price_monitor
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=sua_senha

# Email (Gmail SMTP)
SPRING_MAIL_USERNAME=seu_email@gmail.com
SPRING_MAIL_PASSWORD=sua_senha_de_app

# JWT
JWT_SECRET=sua_chave_secreta_muito_longa_e_segura

# URLs
SCRAPER_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:8081
```

---

## 🚀 Instalação

### Opção 1: Desenvolvimento Local (3 Terminais)

**Terminal 1 - Scraper (Python):**
```bash
cd scraper
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
python -m playwright install chromium
python main.py
```
> Rodando em http://localhost:8000

**Terminal 2 - Backend (Java):**
```bash
cd backend
mvn clean package -DskipTests
java -jar target/price-monitor-1.0.0.jar
```
> Rodando em http://localhost:8081

**Terminal 3 - Frontend (React):**
```bash
cd frontend
npm install
npm run dev
```
> Rodando em http://localhost:5173

### Opção 2: Docker Compose

```bash
# Configurar variáveis
cp .env.example .env
# Editar .env com suas configurações

# Subir todos os serviços
docker-compose up --build
```
> Acesse http://localhost

---

## ⚙ Configuração

### Configurar Email (Gmail)

1. Acesse sua conta Google
2. Vá em **Segurança** > **Verificação em duas etapas** (ative)
3. Vá em **Senhas de app** e gere uma senha
4. Use essa senha no `SPRING_MAIL_PASSWORD`

### Configurar Banco de Dados

**Desenvolvimento (H2 - já configurado):**
- Não precisa fazer nada, usa H2 em memória

**Produção (MySQL):**
```sql
CREATE DATABASE price_monitor;
CREATE USER 'monitor'@'localhost' IDENTIFIED BY 'senha_forte';
GRANT ALL PRIVILEGES ON price_monitor.* TO 'monitor'@'localhost';
```

---

## 📖 Uso

### 1. Criar Conta
- Acesse http://localhost:5173
- Clique em "Criar conta"
- Preencha os dados e confirme o email

### 2. Adicionar Produto
- Copie a URL de um produto do Mercado Livre
- Cole no campo "URL do Produto"
- Clique em "Adicionar"

### 3. Configurar Alertas
- Clique no ícone de sino 🔔 no card do produto
- Ative/desative alertas de queda ou aumento
- Salve as preferências

### 4. Acompanhar Preços
- Clique no card para ver histórico completo
- Veja o gráfico de evolução
- Receba notificações quando houver mudanças

---

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Recuperar senha |
| POST | `/api/auth/reset-password` | Resetar senha |
| GET | `/api/auth/verify-email` | Verificar email |

### Produtos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/products` | Listar produtos |
| POST | `/api/products/scrape` | Adicionar produto |
| DELETE | `/api/products/{id}` | Remover produto |
| GET | `/api/products/{id}/price-history` | Histórico de preços |
| PUT | `/api/products/{id}/notifications` | Config. alertas |
| POST | `/api/products/{id}/refresh` | Atualizar preço |

### Notificações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/notifications` | Listar notificações |
| GET | `/api/notifications/unread-count` | Contar não lidas |
| POST | `/api/notifications/{id}/read` | Marcar como lida |
| POST | `/api/notifications/read-all` | Marcar todas |
| DELETE | `/api/notifications` | Limpar todas |

---

## 🚢 Deploy

### Railway (Recomendado)

1. Crie conta em https://railway.app
2. Conecte seu repositório GitHub
3. Crie 3 serviços: Backend, Frontend, Scraper
4. Configure as variáveis de ambiente
5. Deploy automático a cada push!

### Variáveis no Railway

**Backend:**
```
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:mysql://...
SPRING_MAIL_USERNAME=...
SPRING_MAIL_PASSWORD=...
JWT_SECRET=...
SCRAPER_API_URL=https://seu-scraper.railway.app
FRONTEND_URL=https://seu-frontend.railway.app
```

**Frontend:**
```
VITE_API_URL=https://seu-backend.railway.app
```

---

## 🗺 Roadmap

### ✅ Versão 2.0 (Atual)
- [x] Sistema de autenticação completo
- [x] Monitoramento de preços com histórico
- [x] Notificações por email
- [x] Notificações in-app (sininho)
- [x] **Alertas via WhatsApp** (Evolution API)
- [x] Tutorial de onboarding
- [x] Recuperação de senha
- [x] Verificação de email
- [x] Tema escuro

### 🔜 Versão 2.1 (Em Breve)
- [ ] Landing page com planos
- [ ] Sistema de pagamento (Stripe/Pix)
- [ ] Dashboard com métricas
- [ ] Planos Free / Premium

### 🔮 Versão 3.0 (Futuro)
- [ ] Múltiplos marketplaces (Amazon, Shopee)
- [ ] Comparativo de preços entre lojas
- [ ] Sugestão de preço ideal
- [ ] Relatórios exportáveis (PDF/Excel)
- [ ] App mobile (React Native)

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido  para ajudar vendedores do Mercado Livre a monitorar a concorrência.

---

<div align="center">

**⭐ Se este projeto te ajudou, deixe uma estrela!**

</div>
