-- 🚀 A GRANDE SIMPLIFICAÇÃO (Seth VII)
-- Baseado no feedback do DeepSeek: Foco em Dados Oficiais e Credibilidade

-- 1. Criar a Tabela Canônica de Políticos
-- Esta tabela será a única fonte de verdade para o sistema.
CREATE TABLE IF NOT EXISTS canonical_politicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    office TEXT NOT NULL, -- Ex: 'Deputado Federal', 'Senador'
    party TEXT,
    state CHAR(2),
    camara_id INTEGER, -- ID oficial na API da Câmara
    senado_id INTEGER, -- ID oficial na API do Senado
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir os 20 Políticos Canônicos (Exemplos Iniciais)
INSERT INTO canonical_politicians (name, office, party, state, camara_id, senado_id)
VALUES 
("Erika Hilton", "Deputado Federal", "PSOL", "SP", 220593, NULL),
("Nikolas Ferreira", "Deputado Federal", "PL", "MG", 220538, NULL),
("Arthur Lira", "Deputado Federal", "PP", "AL", 160541, NULL),
("Rodrigo Pacheco", "Senador", "PSD", "MG", NULL, 5894),
('Jones Manoel', 'Político', 'PCB', 'PE', NULL, NULL),
('Luiz Inácio Lula da Silva', 'Presidente', 'PT', 'SP', NULL, NULL),
('Jair Bolsonaro', 'Ex-Presidente', 'PL', 'RJ', NULL, NULL),
('Tabata Amaral', 'Deputado Federal', 'PSB', 'SP', 204534, NULL),
('Guilherme Boulos', 'Deputado Federal', 'PSOL', 'SP', 220534, NULL),
('Eduardo Bolsonaro', 'Deputado Federal', 'PL', 'SP', 178971, NULL),
('Flávio Dino', 'Ministro', 'PSB', 'MA', NULL, 123456), -- Exemplo
('Simone Tebet', 'Ministra', 'MDB', 'MS', NULL, 5678), -- Exemplo
('Ciro Gomes', 'Político', 'PDT', 'CE', NULL, NULL),
('Marina Silva', 'Ministra', 'REDE', 'AC', 74646, NULL),
('Randolfe Rodrigues', 'Senador', 'REDE', 'AP', NULL, 5012),
('Paulo Paim', 'Senador', 'PT', 'RS', NULL, 825),
('Teresa Leitão', 'Senadora', 'PT', 'PE', NULL, 6012),
('Sérgio Moro', 'Senador', 'UNIÃO', 'PR', NULL, 5982),
('Damares Alves', 'Senadora', 'REPUBLICANOS', 'DF', NULL, 6026),
('Hamilton Mourão', 'Senador', 'REPUBLICANOS', 'RS', NULL, 5988),
('Marcos do Val', 'Senador', 'PODEMOS', 'ES', NULL, 5936),
('Magno Malta', 'Senador', 'PL', 'ES', NULL, 3810)
ON CONFLICT (name) DO NOTHING;

-- 3. Desativar o Scout de Notícias (Soft Disable)
-- Adicionamos uma flag de sistema para controlar o processamento de notícias
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_config (key, value)
VALUES ('news_analysis_enabled', 'false'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = 'false'::jsonb;

-- 4. Limpeza de Dados de Notícias (Opcional, mas recomendado para liberar espaço)
-- DELETE FROM scout_history;
-- DELETE FROM public_data_cache WHERE data_type = 'NEWS';

-- 5. Comentário de Auditoria
COMMENT ON TABLE canonical_politicians IS 'Tabela canônica de políticos para a Grande Simplificação do Seth VII.';
