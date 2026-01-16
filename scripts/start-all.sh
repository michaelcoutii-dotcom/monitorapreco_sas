#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Iniciando Aplicação Completa${NC}"
echo -e "${BLUE}========================================${NC}"

# Kill any existing processes
echo -e "${YELLOW}Parando processos antigos...${NC}"
taskkill /IM java.exe /F /T 2>/dev/null || true
taskkill /IM python.exe /F /T 2>/dev/null || true
taskkill /IM node.exe /F /T 2>/dev/null || true
sleep 2

cd /c/Users/Michael/Desktop/sas_mercado_livre

echo -e "${GREEN}✅ Backend (porta 8081)${NC}"
cd /c/Users/Michael/Desktop/sas_mercado_livre/backend
java -jar target/price-monitor-1.0.0.jar &
BACKEND_PID=$!
sleep 8

echo -e "${GREEN}✅ Scraper Python (porta 8000)${NC}"
cd /c/Users/Michael/Desktop/sas_mercado_livre/scraper
/c/Users/Michael/Desktop/sas_mercado_livre/.venv/Scripts/python.exe main.py &
SCRAPER_PID=$!
sleep 3

echo -e "${GREEN}✅ Frontend (porta 5173)${NC}"
cd /c/Users/Michael/Desktop/sas_mercado_livre/frontend
npm run dev &
FRONTEND_PID=$!

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}TUDO RODANDO:${NC}"
echo -e "${GREEN}  Frontend:  http://localhost:5173${NC}"
echo -e "${GREEN}  Backend:   http://localhost:8081${NC}"
echo -e "${GREEN}  Scraper:   http://localhost:8000${NC}"
echo -e "${BLUE}========================================${NC}"

wait
