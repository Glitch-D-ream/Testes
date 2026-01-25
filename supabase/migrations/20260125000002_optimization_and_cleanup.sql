-- Fase 2: Otimização e Cleanup do Supabase

-- 1. Índices Otimizados para Busca e Performance
CREATE INDEX IF NOT EXISTS idx_analyses_author_category ON analyses(author, category);
CREATE INDEX IF NOT EXISTS idx_promises_category_confidence ON promises(category, confidence_score);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp ON audit_logs(action, timestamp DESC);

-- 2. Função para Cleanup Automático de Dados Antigos (Logs e Cache)
-- Mantém apenas os últimos 30 dias de logs de auditoria e cache de dados públicos
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Remover logs de auditoria com mais de 30 dias
    DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Remover cache expirado
    DELETE FROM public_data_cache WHERE expiry_date < NOW();
    
    -- Remover cache de dados públicos com mais de 60 dias (mesmo que não expirado)
    DELETE FROM public_data_cache WHERE last_updated < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql;

-- 3. Agendamento do Cleanup (Simulado via Cron se disponível no Supabase ou via Worker)
-- Nota: No Supabase Free, podemos usar pg_cron se habilitado ou chamar via Edge Function/Worker externo.

-- 4. Otimização de Armazenamento: Converter campos de texto longo para JSONB onde apropriado
-- (Já realizado no schema inicial para extractions, mas garantindo consistência)

-- 5. View para Monitoramento de Espaço (Útil para o Dashboard)
CREATE OR REPLACE VIEW storage_stats AS
SELECT
    schemaname,
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS data_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
