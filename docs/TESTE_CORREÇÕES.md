# 🚀 INSTRUÇÕES DE TESTE - CORREÇÕES APLICADAS

## ✅ Correções Realizadas

### Backend (Java)
- ✅ ProductController.java - Adicionado try/catch e logging detalhado
- ✅ ScraperService.java - Adicionado RestTemplateBuilder com timeouts (10s conexão, 60s leitura)
- ✅ WebConfig.java - CORS expandido para localhost:5173 e localhost:3000
- ✅ application.properties - Logging DEBUG para melhor troubleshooting
- ✅ ScrapeRequest.java - Adicionado @JsonProperty e @NotBlank
- ✅ ScrapeResponse.java - Adicionado validação e toString()

### Frontend (React)
- ✅ App.jsx - API_URL com fallback para http://localhost:8080
- ✅ App.jsx - Retry logic (3 tentativas) para falhas de rede
- ✅ App.jsx - AbortController com timeout (15s buscar, 30s adicionar)
- ✅ App.jsx - Logging detalhado [INFO], [SUCCESS], [ERROR]
- ✅ App.jsx - Tratamento de erro específico por tipo
- ✅ AddProduct.jsx - Validação melhorada de URL
- ✅ AddProduct.jsx - Suporte a colar URL
- ✅ .env.local - Arquivo de configuração criado

---

## 📋 COMO TESTAR

### ✅ Pré-requisitos
- Node.js 18+
- Python 3.9+
- Java 17+
- Maven 3.8+

### 🔧 Terminal 1 - Python Scraper (ESSENCIAL!)
```bash
cd scraper
python -m playwright install chromium  # Primeira vez apenas
python main.py
```
**Esperado:**
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### ☕ Terminal 2 - Java Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/price-monitor-1.0.0.jar
```
**Esperado:**
```
ScraperService initialized with URL: http://localhost:8000
✅ Scraper API is available
```

### ⚛️ Terminal 3 - React Frontend
```bash
cd frontend
npm install
npm run dev
```
**Esperado:**
```
  VITE v7.2.4  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Carregar Produtos Vazios
1. Abra http://localhost:5173
2. Veja "Nenhum produto monitorado"
3. Console: `[INFO] Fetching products from: http://localhost:8080/api/products`
4. Console: `[SUCCESS] Fetched 0 products`

### Teste 2: Adicionar Produto
1. Cole URL: https://www.mercadolivre.com.br/iphone-14/
2. Clique "Monitorar"
3. Esperado: Toast ✅ com nome do produto
4. Console: `[INFO] Adding product from URL: ...`
5. Console: `[SUCCESS] Product added: iPhone 14`

### Teste 3: Validação de URL
1. Cole: `não-é-url`
2. Esperado: Erro "URL inválida"
3. Cole: `https://www.amazon.com/...`
4. Esperado: Erro "URL deve ser do Mercado Livre"

### Teste 4: Timeout/Erro Scraper
1. Interrompa o scraper (Ctrl+C no Terminal 1)
2. Tente adicionar produto
3. Esperado: Toast "❌ Scraper Python não está rodando"

### Teste 5: Timeout/Erro Backend
1. Interrompa o backend (Ctrl+C no Terminal 2)
2. Atualize a página
3. Esperado: Toast "Erro ao carregar produtos. Verifique se o Backend está rodando"

---

## 📊 CONSOLE DO NAVEGADOR (Chrome DevTools)

Esperado ver logs assim:
```
[INFO] Fetching products from: http://localhost:8080/api/products
[SUCCESS] Fetched 2 products
[INFO] Adding product from URL: https://www.mercadolivre.com.br/...
[SUCCESS] Product added: iPhone 14
✅ "iPhone 14" adicionado com sucesso!
```

---

## 📝 CONSOLE DO BACKEND

Esperado ver logs assim:
```
ScraperService initialized with URL: http://localhost:8000
✅ Scraper API is available
Adding new product with URL: https://www.mercadolivre.com.br/...
✅ Scraper success: title='iPhone 14' | price=R$4999.00 | duration=2345ms
Product added successfully: iPhone 14
```

---

## 🚨 SE AINDA DER ERRO

### ❌ "Connection refused" ao adicionar produto
- Terminal 1: Scraper Python não está rodando
- Solução: `python main.py` no Terminal 1

### ❌ CORS error no console
- Verificar se Frontend está em localhost:5173
- Verificar WebConfig.java tem http://localhost:5173 permitido

### ❌ "Erro ao carregar produtos"
- Backend não está rodando em http://localhost:8080
- Solução: `mvn clean spring-boot:run` no Terminal 2

### ❌ Timeout ao adicionar
- URL do produto é muito lenta
- Scraper está processando 30 segundos (máximo)
- Tente outra URL

---

## 🎯 RESUMO DAS MELHORIAS

| Problema | Solução |
|----------|---------|
| 500 Error genérico | Adicionado try/catch com mensagens específicas |
| Scraper não encontrado | Logging mostra exatamente qual é o erro |
| CORS bloqueando | Expandido allowedOrigins |
| Timeout indefinido | Adicionado RestTemplateBuilder e AbortController |
| Sem retry em falhas | Implementado retry logic com 3 tentativas |
| Mensagens genéricas | Adicionado logging detalhado [INFO/SUCCESS/ERROR] |
| API_URL vazia | Fallback para http://localhost:8080 |

---

## ✨ BOA SORTE! 🚀

Se tiver qualquer dúvida ou erro, verifique os logs no console (Frontend) e no terminal (Backend).

