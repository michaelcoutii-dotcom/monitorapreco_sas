@echo off
:: Script para iniciar o MonitoraPreço
:: Basta clonar o projeto e executar este arquivo!

echo ============================================
echo       MonitoraPreco - Iniciando...
echo ============================================
echo.

:: Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    echo Por favor, inicie o Docker Desktop primeiro.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker detectado
echo.

:: Verificar se .env existe, senão criar um padrão
if not exist .env (
    echo [INFO] Criando arquivo .env com valores padrao...
    (
        echo # Banco de Dados
        echo MYSQL_DATABASE=price_monitor
        echo MYSQL_ROOT_PASSWORD=root
        echo MYSQL_USER=price_user
        echo MYSQL_PASSWORD=price123
        echo.
        echo # JWT Secret ^(minimo 88 caracteres para HS512^)
        echo JWT_SECRET=minhaSuperChaveSecretaJWT2024queTemMaisDe64CaracteresParaSerSeguraComHS512AlgoritmoOK
        echo JWT_EXPIRATION=86400000
        echo.
        echo # Telegram Bot ^(configure com seu bot^)
        echo TELEGRAM_BOT_TOKEN=8217374677:AAERK0ATdveQZEFW91cxr2wSSUE_oIvo-4c
        echo TELEGRAM_BOT_USERNAME=monitoraprecoalert_bot
        echo.
        echo # Email SMTP ^(opcional - configure com Gmail^)
        echo MAIL_USERNAME=
        echo MAIL_PASSWORD=
        echo.
        echo # Mercado Livre OAuth ^(opcional^)
        echo ML_CLIENT_ID=
        echo ML_CLIENT_SECRET=
        echo ML_REDIRECT_URI=http://localhost:8081/api/ml/callback
        echo.
        echo # Frontend URL
        echo FRONTEND_URL=http://localhost
    ) > .env
    echo [OK] Arquivo .env criado!
    echo.
    echo IMPORTANTE: Edite o arquivo .env para configurar suas credenciais.
    echo.
)

echo [INFO] Parando containers antigos ^(se existirem^)...
docker-compose down 2>nul

echo.
echo [INFO] Construindo e iniciando todos os servicos...
echo Isso pode levar alguns minutos na primeira vez...
echo.

docker-compose up -d --build

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao iniciar os containers!
    echo Verifique os logs com: docker-compose logs
    pause
    exit /b 1
)

echo.
echo ============================================
echo       MonitoraPreco - Iniciado!
echo ============================================
echo.
echo Aguarde os servicos ficarem prontos...
echo.
echo Status dos containers:
docker-compose ps
echo.
echo ============================================
echo URLs de Acesso:
echo.
echo   Frontend:  http://localhost
echo   Backend:   http://localhost:8081
echo   Scraper:   http://localhost:8000
echo   MySQL:     localhost:3307
echo.
echo ============================================
echo.
echo Para ver logs em tempo real:
echo   docker-compose logs -f
echo.
echo Para parar tudo:
echo   docker-compose down
echo.
pause
