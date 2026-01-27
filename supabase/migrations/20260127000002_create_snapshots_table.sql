-- 🚀 Checkpoint 2: Sistema de Snapshots e Resiliência de Dados
-- Cria a tabela para armazenamento imutável de dados governamentais

CREATE TABLE IF NOT EXISTS data_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_source TEXT NOT NULL, -- Ex: 'siconfi:SAUDE:2023:FEDERAL'
    data_type TEXT NOT NULL,   -- Ex: 'SICONFI', 'CAMARA', 'TSE'
    payload JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca rápida do último snapshot
CREATE INDEX IF NOT EXISTS idx_snapshots_source_version ON data_snapshots (data_source, version DESC);

-- Comentário de Auditoria
COMMENT ON TABLE data_snapshots IS 'Armazena snapshots imutáveis de dados de APIs oficiais para resiliência e histórico.';
