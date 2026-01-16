@echo off
REM Script para executar todo o projeto localmente no Windows

echo.
echo =====================================================
echo  PRICE MONITOR - LOCAL SETUP
echo =====================================================
echo.
echo Este script vai abrir 3 terminais automaticamente:
echo  1. Terminal 1: Python Scraper (porta 8000)
echo  2. Terminal 2: Java Backend (porta 8080)
echo  3. Terminal 3: React Frontend (porta 5173)
echo.
echo ATENCAO: Verifique se ja tem:
echo  - Python 3.9+ instalado
echo  - Java 17+ instalado
echo  - Node.js 18+ instalado
echo.
pause

REM Terminal 1 - Scraper
echo Abrindo Terminal 1 - Python Scraper...
start "Scraper Python (8000)" cmd /k "cd /d scraper && python main.py"

REM Espera um pouco
timeout /t 3 /nobreak

REM Terminal 2 - Backend
echo Abrindo Terminal 2 - Java Backend...
start "Backend Java (8080)" cmd /k "cd /d backend && mvn clean spring-boot:run"

REM Espera um pouco
timeout /t 5 /nobreak

REM Terminal 3 - Frontend
echo Abrindo Terminal 3 - React Frontend...
start "Frontend React (5173)" cmd /k "cd /d frontend && npm run dev"

REM Abre o navegador automaticamente
echo.
echo Abrindo navegador em http://localhost:5173...
timeout /t 8 /nobreak
start http://localhost:5173

echo.
echo =====================================================
echo TUDO INICIADO!
echo =====================================================
echo.
echo Aguarde alguns segundos para todos os servicos iniciarem.
echo.
echo Logs esperados:
echo - Terminal 1: "Uvicorn running on http://0.0.0.0:8000"
echo - Terminal 2: "Tomcat started on port(s): 8080"
echo - Terminal 3: "Local: http://localhost:5173/"
echo.
echo Se houver erro, verifique os terminais para detalhes.
echo.
pause
