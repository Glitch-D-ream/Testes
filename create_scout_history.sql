-- Script para criar a tabela scout_history no Supabase
CREATE TABLE IF NOT EXISTS public.scout_history (
    id TEXT PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT,
    content TEXT,
    source TEXT,
    politician_name TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    analyzed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.scout_history ENABLE ROW LEVEL SECURITY;

-- Criar politica para permitir acesso total com a service role key
DROP POLICY IF EXISTS "Allow full access for service role" ON public.scout_history;
CREATE POLICY "Allow full access for service role" ON public.scout_history
    FOR ALL
    USING (true)
    WITH CHECK (true);
