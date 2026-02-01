# 🔧 Instruções para Aplicar Migração Manualmente

## ⚠️ Importante

A migração precisa ser aplicada **manualmente no Supabase Dashboard** porque:

1. A API REST do Supabase não expõe um endpoint público para executar SQL arbitrário
2. É necessário usar o SQL Editor do Dashboard ou a Supabase CLI

---

## 📝 Opção 1: Via Supabase Dashboard (RECOMENDADO)

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto: **ceexfkjldhsbpugxvuyn**

### Passo 2: Abrir SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New Query"** (botão verde no canto superior direito)

### Passo 3: Copiar e Executar o SQL

Copie e cole o seguinte SQL no editor:

```sql
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
```

### Passo 4: Executar

1. Clique em **"Run"** (botão verde) ou pressione **Ctrl+Enter**
2. Aguarde a execução (deve levar alguns segundos)
3. Verifique se não há erros na saída

### Passo 5: Verificar

Execute esta query para confirmar que a coluna foi adicionada:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;
```

Você deve ver a coluna `ai_verdict_local` com tipo `jsonb` na lista.

---

## 📝 Opção 2: Via Supabase CLI

### Passo 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Passo 2: Fazer Login

```bash
supabase login
```

### Passo 3: Linkar o Projeto

```bash
cd /home/ubuntu/Testes
supabase link --project-ref ceexfkjldhsbpugxvuyn
```

### Passo 4: Aplicar Migração

```bash
supabase db push
```

Isso aplicará automaticamente todas as migrações em `supabase/migrations/`.

---

## 📝 Opção 3: Via psql (PostgreSQL CLI)

Se você tiver acesso direto ao banco de dados:

```bash
# Obter a connection string do Supabase Dashboard
# Settings → Database → Connection string

psql "postgresql://postgres:[YOUR-PASSWORD]@db.ceexfkjldhsbpugxvuyn.supabase.co:5432/postgres" \
  -f supabase/migrations/20260201000001_add_ai_verdict_local.sql
```

---

## ✅ Verificação Final

Após aplicar a migração, execute esta query para confirmar:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'analyses' 
  AND column_name = 'ai_verdict_local';
```

**Resultado esperado**:

| column_name | data_type | is_nullable | column_default |
|-------------|-----------|-------------|----------------|
| ai_verdict_local | jsonb | YES | NULL |

---

## 🚀 Próximos Passos

Após aplicar a migração:

1. ✅ Verifique que a coluna existe
2. ✅ Teste o Dual-Chain Worker novamente
3. ✅ Verifique os logs das GitHub Actions

---

## 🆘 Troubleshooting

### Erro: "relation 'analyses' does not exist"

**Solução**: A tabela `analyses` não existe. Execute o SQL completo de criação da tabela (incluído no SQL acima).

### Erro: "column 'ai_verdict_local' already exists"

**Solução**: A coluna já foi adicionada. Nenhuma ação necessária.

### Erro: "permission denied"

**Solução**: Certifique-se de estar usando a **service_role key** e não a **anon key**.

---

## 📞 Suporte

Se precisar de ajuda:

1. Verifique a documentação do Supabase: https://supabase.com/docs
2. Consulte os logs do SQL Editor para mensagens de erro detalhadas
3. Verifique as permissões da sua conta no projeto

---

**Arquivo de migração**: `supabase/migrations/20260201000001_add_ai_verdict_local.sql`

**Data**: 01 de Fevereiro de 2026
