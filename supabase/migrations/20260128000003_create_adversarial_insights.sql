
-- Migração: Criar tabela adversarial_insights para o Feedback Loop de Aprendizado Adversarial
-- Data: 28 de Janeiro de 2026

CREATE TABLE IF NOT EXISTS adversarial_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_name VARCHAR(255) NOT NULL,
  theme VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  source VARCHAR(100) NOT NULL,
  evidence_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  
  -- Índices para performance
  CONSTRAINT fk_target FOREIGN KEY (target_name) REFERENCES targets(name) ON DELETE CASCADE
);

-- Criar índices para otimizar queries
CREATE INDEX idx_adversarial_target ON adversarial_insights(target_name);
CREATE INDEX idx_adversarial_severity ON adversarial_insights(severity);
CREATE INDEX idx_adversarial_theme ON adversarial_insights(theme);
CREATE INDEX idx_adversarial_created ON adversarial_insights(created_at DESC);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_adversarial_insights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_adversarial_insights_timestamp
BEFORE UPDATE ON adversarial_insights
FOR EACH ROW
EXECUTE FUNCTION update_adversarial_insights_timestamp();

-- Função RPC para incrementar usage_count
CREATE OR REPLACE FUNCTION increment_insight_usage(insight_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE adversarial_insights
  SET usage_count = usage_count + 1
  WHERE id = insight_id;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE adversarial_insights IS 'Armazena descobertas de contradições e padrões adversariais para aprendizado futuro do sistema';
COMMENT ON COLUMN adversarial_insights.target_name IS 'Nome do alvo político (ex: Arthur Lira)';
COMMENT ON COLUMN adversarial_insights.theme IS 'Tema da contradição (ex: Orçamento Secreto, Votação Contraditória)';
COMMENT ON COLUMN adversarial_insights.severity IS 'Nível de severidade da descoberta';
COMMENT ON COLUMN adversarial_insights.source IS 'Serviço que detectou (ex: Temporal Incoherence, Vulnerability Auditor)';
COMMENT ON COLUMN adversarial_insights.usage_count IS 'Quantas vezes este insight foi utilizado em buscas futuras';
