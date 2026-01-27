
-- Habilitar a extensão ltree se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS ltree;

-- Tabela de Conexões de Entidades (Grafos)
CREATE TABLE IF NOT EXISTS entity_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id VARCHAR(100) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  relationship_type VARCHAR(50) NOT NULL, -- 'CONTRATO', 'LICITACAO', 'PROCESSO', 'SOCIO', etc.
  source_document VARCHAR(255), -- URL ou ID do documento de origem
  confidence_score FLOAT DEFAULT 1.0,
  metadata JSONB DEFAULT '{}'::jsonb,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  path LTREE -- Para consultas hierárquicas e de caminho
);

-- Índices para buscas eficientes
CREATE INDEX IF NOT EXISTS idx_entity_connections_source ON entity_connections(source_id);
CREATE INDEX IF NOT EXISTS idx_entity_connections_target ON entity_connections(target_id);
CREATE INDEX IF NOT EXISTS idx_entity_connections_type ON entity_connections(relationship_type);
CREATE INDEX IF NOT EXISTS idx_entity_path ON entity_connections USING GIST (path);

-- Comentários para documentação
COMMENT ON TABLE entity_connections IS 'Armazena relacionamentos extraídos entre entidades (políticos, empresas, processos).';
COMMENT ON COLUMN entity_connections.path IS 'Caminho hierárquico usando a extensão ltree para facilitar buscas de grafos.';
