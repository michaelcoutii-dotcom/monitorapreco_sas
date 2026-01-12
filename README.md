# Price Monitor - Mercado Livre

Sistema de monitoramento de preços do Mercado Livre.

## Estrutura

```
├── scraper/          # Python - API de scraping
├── backend/          # Java Spring Boot - Backend principal
├── frontend/         # React - Interface do usuário
└── docker-compose.yml
```

## Rodar Localmente (Desenvolvimento)

### Sem Docker

**Terminal 1 - Python:**
```bash
cd scraper
pip install -r requirements.txt
python -m playwright install chromium
python main.py
```

**Terminal 2 - Java:**
```bash
cd backend
mvn package -DskipTests
java -jar target/price-monitor-1.0.0.jar
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Com Docker

```bash
# Criar arquivo .env
cp .env.example .env
# Editar .env com suas configurações

# Subir todos os serviços
docker-compose up --build
```

Acesse: http://localhost

## Deploy (Railway)

1. Crie uma conta em https://railway.app
2. Conecte seu repositório GitHub
3. Adicione as variáveis de ambiente:
   - `RESEND_API_KEY`
   - `NOTIFICATION_EMAIL`
4. Deploy automático!

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `RESEND_API_KEY` | API key do Resend para emails |
| `NOTIFICATION_EMAIL` | Email para receber alertas |
| `SCRAPER_API_URL` | URL da API Python |
| `SPRING_DATASOURCE_URL` | URL do PostgreSQL |

## Tecnologias

- **Scraper:** Python, Playwright, FastAPI
- **Backend:** Java 21, Spring Boot, JPA
- **Frontend:** React, Tailwind CSS, Vite
- **Database:** PostgreSQL (prod) / H2 (dev)
