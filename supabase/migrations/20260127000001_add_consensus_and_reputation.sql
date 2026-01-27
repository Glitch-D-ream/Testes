-- 🚀 Checkpoint 1: Módulo Consensus e Reputação Dinâmica
-- Adiciona suporte para score de confiabilidade e agrupamento de consenso

-- 1. Adicionar colunas na tabela scout_history (ou scout_sources)
-- Nota: O código usa 'scout_history' no database.ts
ALTER TABLE scout_history 
ADD COLUMN IF NOT EXISTS reliability_score FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS consensus_group UUID,
ADD COLUMN IF NOT EXISTS consensus_status TEXT DEFAULT 'pending'; -- 'pending', 'verified', 'divergent'

-- 2. Criar tabela para armazenar a reputação histórica das fontes
CREATE TABLE IF NOT EXISTS source_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT UNIQUE NOT NULL,
    reputation_score FLOAT DEFAULT 1.0,
    total_contributions INTEGER DEFAULT 0,
    divergence_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar colunas na tabela analyses para refletir o consenso
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS consensus_metrics JSONB DEFAULT '{}'::jsonb;

-- 4. Comentários de Auditoria
COMMENT ON COLUMN scout_history.reliability_score IS 'Score de confiabilidade dinâmico da fonte para este registro específico.';
COMMENT ON TABLE source_reputation IS 'Armazena a reputação histórica de longo prazo de cada fonte de dados.';
