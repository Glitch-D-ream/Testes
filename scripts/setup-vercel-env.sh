#!/bin/bash

# Script para configurar variáveis de ambiente no Vercel
# Uso: ./scripts/setup-vercel-env.sh

echo "🚀 Configurando variáveis de ambiente no Vercel..."
echo ""

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

# Verificar se está logado
echo "📝 Verificando autenticação..."
vercel whoami || vercel login

echo ""
echo "📋 Configurando variáveis de ambiente..."
echo ""

# Função para adicionar variável de ambiente
add_env() {
    local key=$1
    local value=$2
    local env_type=${3:-production}
    
    if [ -z "$value" ]; then
        echo "⚠️  Pulando $key (valor vazio)"
        return
    fi
    
    echo "➕ Adicionando $key..."
    echo "$value" | vercel env add "$key" "$env_type" --force
}

# Solicitar valores
echo "Por favor, forneça os seguintes valores:"
echo ""

read -p "TELEGRAM_BOT_TOKEN (do BotFather): " TELEGRAM_BOT_TOKEN
read -p "WEBHOOK_DOMAIN (ex: https://seu-app.vercel.app): " WEBHOOK_DOMAIN
read -p "APP_URL (mesma URL do WEBHOOK_DOMAIN): " APP_URL
read -p "DATABASE_URL (Supabase ou outro): " DATABASE_URL
read -p "JWT_SECRET (string aleatória segura): " JWT_SECRET
read -p "GEMINI_API_KEY (opcional): " GEMINI_API_KEY
read -p "GROQ_API_KEY (opcional): " GROQ_API_KEY

echo ""
echo "🔧 Adicionando variáveis ao Vercel..."
echo ""

# Adicionar variáveis de ambiente
add_env "NODE_ENV" "production" "production"
add_env "TELEGRAM_BOT_TOKEN" "$TELEGRAM_BOT_TOKEN" "production"
add_env "WEBHOOK_DOMAIN" "$WEBHOOK_DOMAIN" "production"
add_env "APP_URL" "$APP_URL" "production"
add_env "DATABASE_URL" "$DATABASE_URL" "production"
add_env "JWT_SECRET" "$JWT_SECRET" "production"
add_env "GEMINI_API_KEY" "$GEMINI_API_KEY" "production"
add_env "GROQ_API_KEY" "$GROQ_API_KEY" "production"

echo ""
echo "✅ Variáveis de ambiente configuradas com sucesso!"
echo ""
echo "📦 Próximos passos:"
echo "1. Fazer deploy: vercel --prod"
echo "2. Configurar webhook: curl -X POST $WEBHOOK_DOMAIN/api/telegram/set-webhook"
echo "3. Verificar status: curl $WEBHOOK_DOMAIN/api/telegram/status"
echo ""
