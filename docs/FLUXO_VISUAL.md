# 📊 FLUXO CORRIGIDO - VISUAL

## 🔄 FLUXO 1: Carregar Produtos (GET /api/products)

```
┌─────────────────────┐
│  FRONTEND (React)   │
│                     │
│ fetchProducts()     │
│ [INFO] Fetching...  │
└──────────┬──────────┘
           │
           │ fetch + AbortController (15s timeout)
           │
           ▼
┌─────────────────────────────────────────┐
│     BACKEND (Spring Boot:8080)          │
│                                         │
│ GET /api/products                       │
│ [try/catch] getAllProducts()            │
└──────────┬──────────────────────────────┘
           │
           │ ResponseEntity.ok(List<Product>)
           │
           ▼
┌─────────────────────────────────────────┐
│    DATABASE (H2/PostgreSQL)             │
│                                         │
│ SELECT * FROM products                  │
└──────────┬──────────────────────────────┘
           │
           │ Return List
           │
           ▼
┌──────────────────────────────────────────────┐
│         SUCCESS RESPONSE                     │
│                                              │
│ HTTP 200 OK                                  │
│ [SUCCESS] Fetched 2 products                 │
│ setProducts(data)                            │
│ Toast: Nenhum erro                           │
└──────────────────────────────────────────────┘

POSSÍVEIS ERROS:
├─ Timeout (15s): [AbortError] Toast: "Timeout"
├─ Conexão falha: [Failed to fetch] Toast: "Backend não rodando"
└─ HTTP error: [ERROR] Toast: mensagem específica
```

---

## 🔄 FLUXO 2: Adicionar Produto (POST /api/products)

```
┌──────────────────────────┐
│   USUÁRIO                │
│                          │
│ Cole URL do produto      │
│ https://mercadolivre...  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  FRONTEND - VALIDAÇÃO (Client-side)  │
│                                      │
│ 1. validateUrl()                     │
│    ├─ Vazio? Erro: "Cole URL"        │
│    ├─ Invalid format? Erro: "Inválida"
│    ├─ Não ML? Erro: "Mercado Livre"  │
│    └─ OK? Continua...                │
└──────────┬──────────────────────────┘
           │
           │ Valid? Yes
           │
           ▼
┌──────────────────────────────────────┐
│   FRONTEND - HTTP REQUEST             │
│                                       │
│ POST /api/products                    │
│ { url: "..." }                        │
│ [INFO] Adding product...              │
│ AbortController (30s timeout)         │
└──────────┬──────────────────────────┘
           │
           │ fetch + timeout
           │
           ▼
┌─────────────────────────────────────────┐
│    BACKEND (Spring Boot:8080)           │
│                                         │
│ POST /api/products [try/catch]          │
│ ├─ [INFO] Adding new product            │
│ └─ URL válida? Sim, continua...        │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│    ScraperService.fetchProductData()    │
│                                         │
│ POST http://localhost:8000/scrape       │
│ RestTemplate + timeout (10s conn, 60s)  │
│ [DEBUG] Calling scraper API...          │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│      PYTHON SCRAPER (FastAPI:8000)      │
│                                         │
│ POST /scrape                            │
│ ├─ Playwright.goto(url)                 │
│ ├─ Espera DOM carregar                  │
│ ├─ Extract: title, price, image         │
│ └─ Return JSON response                 │
└──────────┬──────────────────────────────┘
           │
           │ ScrapeResponse
           │ { title, price, imageUrl }
           │
           ▼
┌──────────────────────────────────────────┐
│   ScraperService - Resultado             │
│                                          │
│ ✅ Sucesso?                              │
│    ✅ Scraper success: title=...         │
│    └─ Return ScrapeResponse              │
│                                          │
│ ❌ Falha?                                │
│    ├─ Connection refused?                │
│    │  └─ ❌ "SCRAPER NOT AVAILABLE"      │
│    ├─ Timeout?                           │
│    │  └─ ❌ "Timeout"                    │
│    └─ JSON error?                        │
│       └─ ❌ "Parse error"                │
└──────────┬───────────────────────────────┘
           │
           ▼ (se sucesso)
┌──────────────────────────────────────────┐
│    ProductService.addProduct()           │
│                                          │
│ 1. Create Product entity                 │
│    ├─ setName(title)                     │
│    ├─ setUrl(url)                        │
│    ├─ setCurrentPrice(price)             │
│    └─ setImageUrl(imageUrl)              │
│                                          │
│ 2. productRepository.save(product)       │
│    └─ INSERT INTO products...            │
│                                          │
│ 3. priceHistoryRepository.save(history)  │
│    └─ INSERT INTO price_history...       │
│                                          │
│ 4. [INFO] Product added successfully    │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│     ProductController - Response         │
│                                          │
│ HTTP 201 CREATED                         │
│ { id, name, url, currentPrice, ... }     │
└──────────┬───────────────────────────────┘
           │
           │ JSON response
           │
           ▼
┌──────────────────────────────────────────┐
│   FRONTEND - Resultado                   │
│                                          │
│ ✅ Sucesso (response.ok)?                │
│    ├─ [SUCCESS] Product added: iPhone   │
│    ├─ Toast: "✅ iPhone adicionado!"     │
│    ├─ fetchProducts() (recarrega lista)  │
│    └─ setUrl('') (limpa input)           │
│                                          │
│ ❌ Erro?                                 │
│    ├─ AbortError (timeout)?              │
│    │  └─ Toast: "❌ Timeout ao scraper"  │
│    ├─ Failed to fetch (conexão)?         │
│    │  └─ Toast: "❌ Backend indisponível"│
│    ├─ Scraper error?                     │
│    │  └─ Toast: "❌ Scraper não rodando" │
│    └─ URL inválida?                      │
│       └─ Toast: "❌ URL inválida"        │
└──────────────────────────────────────────┘
```

---

## 🔄 FLUXO 3: Deletar Produto (DELETE /api/products/{id})

```
┌────────────────────────────┐
│  Usuário clica DELETE      │
│  em um produto             │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  ConfirmModal aberto                   │
│  "Tem certeza?"                        │
│  [Cancelar] [Deletar]                  │
└──────────┬─────────────────────────────┘
           │ Usuário clica [Deletar]
           │
           ▼
┌────────────────────────────────────────┐
│  Frontend: confirmDelete()             │
│                                        │
│  fetch DELETE /api/products/{id}       │
│  [INFO] Deleting product: 1            │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  Backend: removeProduct(id)            │
│                                        │
│  [try/catch]                           │
│  productRepository.deleteById(id)      │
│  [INFO] Removing product with ID: 1    │
│                                        │
│  HTTP 204 NO CONTENT                   │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  Frontend: sucesso                     │
│                                        │
│  [SUCCESS] Product deleted: iPhone     │
│  Toast: "✅ iPhone removido com sucesso" 
│  fetchProducts() (recarrega)           │
└────────────────────────────────────────┘
```

---

## 🔄 FLUXO 4: Atualizar Preços (POST /api/products/refresh)

```
┌────────────────────────────┐
│  Usuário clica REFRESH     │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  Frontend: refreshPrices()             │
│                                        │
│  fetch POST /api/products/refresh      │
│  [INFO] Refreshing prices manually     │
│  Toast: "🔄 Preços sendo atualizados..." 
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  Backend: scheduler.triggerManualCheck()│
│                                        │
│  [INFO] Manual price refresh triggered │
│                                        │
│  HTTP 200 OK                           │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  Scheduler.checkPrices()               │
│                                        │
│  FOR each product:                     │
│  ├─ ScraperService.fetchProductData()  │
│  ├─ Compare newPrice vs currentPrice   │
│  ├─ Save PriceHistory                  │
│  └─ IF price dropped:                  │
│      └─ EmailService.sendEmail()       │
│         └─ Resend API                  │
│                                        │
│  [INFO] Price update complete          │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│  Frontend: Aguarda 2s, recarrega       │
│                                        │
│  setTimeout(() => fetchProducts(), 2s) │
│  Toast: "✅ Preços atualizados!"        │
│  setRefreshing(false)                  │
└────────────────────────────────────────┘
```

---

## 🚨 TRATAMENTO DE ERROS - DIAGRAMA

```
CENÁRIO 1: Scraper não está rodando
├─ Frontend tenta adicionar produto
├─ Backend chama ScraperService.fetchProductData()
├─ RestTemplate tenta: POST http://localhost:8000/scrape
├─ ❌ Connection refused!
├─ Catch: ResourceAccessException
├─ Log: "❌ SCRAPER NOT AVAILABLE"
├─ Retorna: null
├─ ProductController: product == null
├─ HTTP 422 UNPROCESSABLE_ENTITY
├─ Frontend recebe erro.error = "scraper is running"
└─ Toast: "❌ Scraper Python não está rodando. Inicie..."

CENÁRIO 2: URL muito lenta
├─ Frontend cola URL de site lento
├─ Backend chama ScraperService (30s timeout no frontend)
├─ ScraperService: page.goto(url, timeout=30000)
├─ ⏱️ Página demora 35s para carregar
├─ ❌ Timeout!
├─ Catch: PlaywrightTimeout
├─ Log: "❌ Failed to scrape"
├─ Retorna: null
├─ Frontend recebe timeout
└─ Toast: "❌ Timeout ao scraper"

CENÁRIO 3: Backend indisponível
├─ Frontend tenta fetch /api/products
├─ Backend em http://localhost:8080 não responde
├─ ❌ Failed to fetch
├─ Frontend retry 3x (com 1s delay)
├─ Depois de 3 tentativas, falha
├─ addToast() com mensagem específica
└─ Toast: "Erro ao carregar. Verifique se Backend..."

CENÁRIO 4: URL inválida (cliente)
├─ Frontend validateUrl("não-é-url")
├─ try { new URL("não-é-url") }
├─ ❌ Error: Invalid URL
├─ Sem requisição ao backend
├─ setError("URL inválida")
└─ Toast: "❌ URL inválida"

CENÁRIO 5: URL não é Mercado Livre
├─ Frontend validateUrl("https://amazon.com/...")
├─ URL formato OK
├─ !url.includes('mercadolivre') && !url.includes('mercadolibre')
├─ ❌ Check falhou
├─ Sem requisição ao backend
└─ Toast: "❌ URL deve ser do Mercado Livre"
```

---

## 📈 ANTES vs DEPOIS

| Aspecto | ANTES ❌ | DEPOIS ✅ |
|---------|----------|----------|
| Error 500 | Genérico, sem mensagem | Específico com detalhes |
| Scraper Error | Sem indicação | "SCRAPER NOT AVAILABLE" |
| Timeout | Sem timeout, trava | 10s conexão, 60s leitura |
| Retry | Sem retry | 3x com 1s delay |
| Validação URL | Só no backend | Client + server |
| Logging | Nenhum | [INFO/SUCCESS/ERROR] |
| Documentação | Não | Completa |

---

## 🎯 RESUMO

Todos os 4 fluxos principais agora têm:
- ✅ Try/catch com erro handling
- ✅ Logging detalhado
- ✅ Timeout configurado
- ✅ Mensagens de erro específicas
- ✅ Retry logic (quando aplicável)
- ✅ Documentação clara

