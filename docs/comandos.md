# Guia Rápido de Comandos

Este arquivo contém os comandos necessários para iniciar os diferentes serviços do projeto.

---

### 1. Backend (Java/Spring Boot)

Para iniciar o backend, primeiro é necessário compilar o projeto com o Maven e depois executar o arquivo `.jar` gerado.

**Passo 1: Compilar o projeto**
(Execute a partir da pasta `backend/`)
```shell
mvn clean package
```

**Passo 2: Iniciar o servidor**
(Execute a partir da pasta `backend/`)
```shell
java -jar target/price-monitor-1.0.0.jar
```

**Comando combinado (a partir da raiz do projeto):**
```shell
cd backend && mvn clean package && java -jar target/price-monitor-1.0.0.jar
```

---

### 2. Frontend (React)

Para iniciar o servidor de desenvolvimento do frontend.

(Execute a partir da pasta `frontend/`)
```shell
npm run dev
```

---

### 3. Scraper (Python)

Para iniciar a API do scraper.

(Execute a partir da pasta `scraper/`)
```shell
# Usando o venv do projeto
C:/Users/Michael/Desktop/sas_mercado_livre/.venv/Scripts/python.exe -m uvicorn main:app --reload
```
*Observação: O comando acima inicia o servidor com "hot-reload", que reinicia o servidor automaticamente após alterações no código.*
