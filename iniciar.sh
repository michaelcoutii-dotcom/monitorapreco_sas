#!/bin/bash
# Script para iniciar o MonitoraPreço
# Basta clonar o projeto e executar este arquivo!

echo "============================================"
echo "      MonitoraPreço - Iniciando..."
echo "============================================"
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "[ERRO] Docker não está rodando!"
    echo "Por favor, inicie o Docker primeiro."
    exit 1
fi

echo "[OK] Docker detectado"
echo ""

# Verificar se .env existe, senão criar um padrão
if [ ! -f .env ]; then
    echo "[INFO] Criando arquivo .env com valores padrão..."
    cat > .env << 'EOF'
# Banco de Dados
MYSQL_DATABASE=price_monitor
MYSQL_ROOT_PASSWORD=root
MYSQL_USER=price_user
MYSQL_PASSWORD=price123

# JWT Secret (mínimo 88 caracteres para HS512)
JWT_SECRET=minhaSuperChaveSecretaJWT2024queTemMaisDe64CaracteresParaSerSeguraComHS512AlgoritmoOK
JWT_EXPIRATION=86400000

# Telegram Bot (configure com seu bot)
TELEGRAM_BOT_TOKEN=8217374677:AAERK0ATdveQZEFW91cxr2wSSUE_oIvo-4c
TELEGRAM_BOT_USERNAME=monitoraprecoalert_bot

# Email SMTP (opcional - configure com Gmail)
MAIL_USERNAME=
MAIL_PASSWORD=

# Mercado Livre OAuth (opcional)
ML_CLIENT_ID=
ML_CLIENT_SECRET=
ML_REDIRECT_URI=http://localhost:8081/api/ml/callback

# Frontend URL
FRONTEND_URL=http://localhost
EOF
    echo "[OK] Arquivo .env criado!"
    echo ""
    echo "IMPORTANTE: Edite o arquivo .env para configurar suas credenciais."
    echo ""
fi

echo "[INFO] Parando containers antigos (se existirem)..."
docker-compose down 2>/dev/null

echo ""
echo "[INFO] Construindo e iniciando todos os serviços..."
echo "Isso pode levar alguns minutos na primeira vez..."
echo ""

docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERRO] Falha ao iniciar os containers!"
    echo "Verifique os logs com: docker-compose logs"
    exit 1
fi

echo ""
echo "============================================"
echo "      MonitoraPreço - Iniciado!"
echo "============================================"
echo ""
echo "Aguarde os serviços ficarem prontos..."
echo ""
echo "Status dos containers:"
docker-compose ps
echo ""
echo "============================================"
echo "URLs de Acesso:"
echo ""
echo "  Frontend:  http://localhost"
echo "  Backend:   http://localhost:8081"
echo "  Scraper:   http://localhost:8000"
echo "  MySQL:     localhost:3307"
echo ""
echo "============================================"
echo ""
echo "Para ver logs em tempo real:"
echo "  docker-compose logs -f"
echo ""
echo "Para parar tudo:"
echo "  docker-compose down"
echo ""
