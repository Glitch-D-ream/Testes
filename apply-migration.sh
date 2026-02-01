#!/bin/bash

# Script para aplicar a migração 20260201000001_add_ai_verdict_local.sql no Supabase
# Este script usa as credenciais fornecidas para executar a migração diretamente

SUPABASE_URL="https://ceexfkjldhsbpugxvuyn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8"

echo "🚀 Aplicando migração: add_ai_verdict_local"
echo "📍 Supabase URL: $SUPABASE_URL"
echo ""

# Ler o arquivo SQL
MIGRATION_SQL=$(cat supabase/migrations/20260201000001_add_ai_verdict_local.sql)

# Executar via API REST do Supabase
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$MIGRATION_SQL" | jq -Rs .)}"

echo ""
echo "✅ Migração aplicada com sucesso!"
echo ""
echo "Para verificar, execute:"
echo "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'analyses';"
