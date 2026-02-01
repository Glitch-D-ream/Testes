#!/usr/bin/env python3
"""
Script para aplicar a migração add_ai_verdict_local no Supabase
Usa a API REST do Supabase para executar SQL diretamente
"""

import os
import requests
import json

SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://ceexfkjldhsbpugxvuyn.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZXhma2psZGhzYnB1Z3h2dXluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ1NTU0NCwiZXhwIjoyMDUzMDMxNTQ0fQ.x1Zog0FPn7urshqbA_IoiXBxR8aJzST2X76MkOdmufmaqb5w_5EkIA3ie')

# SQL da migração
MIGRATION_SQL = """
-- Verificar se a tabela analyses existe, se não, criar
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  politician_id TEXT REFERENCES politicians(id),
  text TEXT NOT NULL,
  author TEXT,
  category TEXT,
  extracted_promises JSONB,
  probability_score REAL,
  methodology_notes TEXT,
  data_sources JSONB,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna ai_verdict_local se não existir
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS ai_verdict_local JSONB;

-- Adicionar índice GIN para performance em queries JSONB
CREATE INDEX IF NOT EXISTS idx_analyses_ai_verdict ON analyses USING GIN (ai_verdict_local);

-- Adicionar índice para status
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

-- Adicionar índice para author
CREATE INDEX IF NOT EXISTS idx_analyses_author ON analyses(author);
"""

def execute_sql(sql):
    """Executa SQL via API REST do Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'query': sql
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        return response
    except Exception as e:
        print(f"❌ Erro ao executar SQL: {e}")
        return None

def check_column_exists():
    """Verifica se a coluna ai_verdict_local existe"""
    url = f"{SUPABASE_URL}/rest/v1/information_schema.columns"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    params = {
        'table_name': 'eq.analyses',
        'column_name': 'eq.ai_verdict_local',
        'select': 'column_name,data_type'
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return len(data) > 0
        return False
    except:
        return False

def main():
    print("🚀 Iniciando aplicação da migração...")
    print(f"📍 Supabase URL: {SUPABASE_URL}")
    print("")
    
    # Verificar se a coluna já existe
    print("🔍 Verificando se a coluna ai_verdict_local já existe...")
    if check_column_exists():
        print("✅ A coluna ai_verdict_local já existe!")
        print("ℹ️  Nenhuma ação necessária.")
        return
    
    print("⚠️  A coluna ai_verdict_local não existe. Aplicando migração...")
    print("")
    
    # Executar a migração
    print("📝 Executando SQL da migração...")
    response = execute_sql(MIGRATION_SQL)
    
    if response is None:
        print("❌ Falha ao executar migração")
        return
    
    if response.status_code in [200, 201, 204]:
        print("✅ Migração executada com sucesso!")
    else:
        print(f"❌ Erro ao executar migração: {response.status_code}")
        print(f"Resposta: {response.text}")
        return
    
    print("")
    print("🔍 Verificando se a coluna foi adicionada...")
    if check_column_exists():
        print("✅ Coluna ai_verdict_local adicionada com sucesso!")
    else:
        print("⚠️  Não foi possível verificar a coluna. Verifique manualmente no Supabase Dashboard.")
    
    print("")
    print("✨ Processo concluído!")

if __name__ == '__main__':
    main()
