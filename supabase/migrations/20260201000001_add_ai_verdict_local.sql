-- Migração: Adicionar coluna ai_verdict_local à tabela analyses
-- Data: 01 de Fevereiro de 2026
-- Objetivo: Suportar o veredito da Dual-Chain AI (Qwen + DeepSeek)

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

-- Adicionar índice para status (usado frequentemente em queries)
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

-- Adicionar índice para author (usado em buscas)
CREATE INDEX IF NOT EXISTS idx_analyses_author ON analyses(author);

-- Comentários para documentação
COMMENT ON COLUMN analyses.ai_verdict_local IS 'Veredito da Dual-Chain AI (Qwen + DeepSeek) processado localmente no GitHub Actions. Estrutura: {qwen_output, deepseek_reasoning, processed_at, engine}';
COMMENT ON COLUMN analyses.status IS 'Status da análise: pending, processing_ai, completed, failed';
COMMENT ON COLUMN analyses.progress IS 'Progresso da análise em porcentagem (0-100)';
