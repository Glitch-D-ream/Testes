# Análise de Problemas - GitHub Actions (Seth VII)

## 📋 Resumo Executivo

Foram identificados **dois problemas principais** nas GitHub Actions do projeto Seth VII:

1. **Super-Orchestrator**: Falha ao executar o script TypeScript com erro de módulo ESM
2. **Dual-Chain Worker**: Falha ao atualizar banco de dados - coluna `ai_verdict_local` não existe na tabela `analyses`

---

## 🔴 Problema 1: Super-Orchestrator - Erro de Execução ESM

### Workflow Afetado
`.github/workflows/super-orchestrator.yml`

### Erro Identificado
```
Node.js v20.20.0
node:internal/modules/run_main:123
    triggerUncaughtException(
    ^
[Object: null prototype] {
  [Symbol(nodejs.util.inspect.custom)]: [Function: [nodejs.util.inspect.custom]]
}
Process completed with exit code 1.
```

### Causa Raiz
O workflow está tentando executar o script usando:
```bash
node --loader ts-node/esm server/scripts/super-orchestrator.ts
```

Porém, o commit mais recente (`52009237`) indica que a correção deveria usar `tsx`:
```
fix: use tsx for super-orchestrator execution to ensure ESM compatibility
```

### Problema no Workflow
A linha 57 do arquivo `super-orchestrator.yml` ainda está usando o comando antigo:
```yaml
run: node --loader ts-node/esm server/scripts/super-orchestrator.ts
```

Mas deveria estar usando:
```yaml
run: npx tsx server/scripts/super-orchestrator.ts
```

### Conflito de Versões
- **Node.js no workflow**: v20.20.0
- **Node.js requerido pelo projeto**: >=22.0.0 (conforme mensagem de warning durante instalação)

---

## 🔴 Problema 2: Dual-Chain Worker - Coluna Inexistente

### Workflow Afetado
`.github/workflows/dual-chain-worker.yml`

### Erro Identificado
```
❌ Erro no Worker: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'ai_verdict_local' column of 'analyses' in the schema cache"
}
```

### Causa Raiz
O script `server/scripts/dual-chain-worker.ts` tenta atualizar a coluna `ai_verdict_local` na tabela `analyses`:

```typescript
const { error: updateError } = await supabase
  .from('analyses')
  .update({
    ai_verdict_local: {
      qwen_output: structuredData,
      deepseek_reasoning: reasoning,
      processed_at: new Date().toISOString(),
      engine: 'Dual-Chain (GitHub Actions)'
    },
    status: 'completed'
  })
  .eq('id', analysisId);
```

### Problema no Banco de Dados
A tabela `analyses` no Supabase **não possui a coluna `ai_verdict_local`**.

Analisando o arquivo `scripts/generate-sql.ts`, a definição da tabela `analyses` é:

```sql
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Falta a coluna `ai_verdict_local JSONB`**.

### Migrações Existentes
As migrações em `supabase/migrations/` não criam a tabela `analyses` nem adicionam a coluna `ai_verdict_local`:

- `20260125000002_optimization_and_cleanup.sql` - Apenas índices e funções de limpeza
- `20260126000001_grande_simplificacao.sql` - Cria `canonical_politicians` e `system_config`
- `20260127000001_add_consensus_and_reputation.sql` - Adiciona colunas de consenso
- `20260127000002_create_snapshots_table.sql` - Cria tabela `snapshots`
- `20260127_create_entity_connections.sql` - Cria tabela de conexões
- `20260128000003_create_adversarial_insights.sql` - Cria tabela `adversarial_insights`

**Nenhuma migração cria ou altera a tabela `analyses`**.

---

## 🔧 Soluções Recomendadas

### Solução 1: Corrigir Super-Orchestrator Workflow

**Arquivo**: `.github/workflows/super-orchestrator.yml`

**Mudança necessária** (linha 57):

```yaml
# ANTES (incorreto)
run: node --loader ts-node/esm server/scripts/super-orchestrator.ts

# DEPOIS (correto)
run: npx tsx server/scripts/super-orchestrator.ts
```

**Também atualizar a versão do Node.js** (linha 21):

```yaml
# ANTES
node-version: '20'

# DEPOIS
node-version: '22'
```

---

### Solução 2: Adicionar Coluna ai_verdict_local ao Banco

**Opção A: Criar migração SQL**

Criar arquivo: `supabase/migrations/20260201000001_add_ai_verdict_local.sql`

```sql
-- Adicionar coluna ai_verdict_local à tabela analyses
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS ai_verdict_local JSONB;

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_analyses_ai_verdict ON analyses USING GIN (ai_verdict_local);

-- Comentário para documentação
COMMENT ON COLUMN analyses.ai_verdict_local IS 'Veredito da Dual-Chain AI (Qwen + DeepSeek) processado localmente no GitHub Actions';
```

**Opção B: Executar via Supabase Dashboard**

Acessar o Supabase Dashboard → SQL Editor e executar:

```sql
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS ai_verdict_local JSONB;
CREATE INDEX IF NOT EXISTS idx_analyses_ai_verdict ON analyses USING GIN (ai_verdict_local);
```

---

### Solução 3: Verificar se Tabela analyses Existe

**Antes de adicionar a coluna**, verificar se a tabela `analyses` já existe no Supabase.

**Comando para verificar** (via Supabase SQL Editor):

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'analyses';
```

**Se a tabela não existir**, criar usando o SQL completo de `scripts/generate-sql.ts` **com a coluna adicional**:

```sql
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
  ai_verdict_local JSONB,  -- ADICIONAR ESTA LINHA
  status TEXT DEFAULT 'pending',  -- ADICIONAR ESTA LINHA
  progress INTEGER DEFAULT 0,  -- ADICIONAR ESTA LINHA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔍 Informações Adicionais

### Credenciais Fornecidas

**Supabase**:
- URL: `https://ceexfkjldhsbpugxvuyn.supabase.co`
- Secret Key: `sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8`
- Publishable Key: `sb_publishable_aJzST2X76MkOdmufmaqb5w_5EkIA3ie`

**GitHub Token**:
- Token: `ghp_[SEU_TOKEN_AQUI]`

### Secrets do GitHub Actions

Verificar se os seguintes secrets estão configurados no repositório:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GH_TOKEN_CUSTOM` (usado pelo dual-chain-worker)
- `OPENAI_API_KEY` (opcional)
- `GEMINI_API_KEY` (opcional)
- `HUGGINGFACE_TOKEN` (opcional)

---

## 📊 Status Atual das Actions

| Workflow | Status | Problema |
|----------|--------|----------|
| Super Orchestrator | ❌ Falhando | Comando de execução incorreto + Node.js v20 |
| Dual-Chain Worker | ❌ Falhando | Coluna `ai_verdict_local` não existe |
| Scout Worker | ✅ Sucesso | Funcionando normalmente |
| Health Check | ✅ Sucesso | Funcionando normalmente |

---

## 🎯 Próximos Passos

1. **Imediato**: Corrigir o workflow `super-orchestrator.yml`
2. **Imediato**: Adicionar coluna `ai_verdict_local` à tabela `analyses` no Supabase
3. **Verificação**: Testar manualmente os workflows após as correções
4. **Opcional**: Criar migração formal para versionamento do schema
5. **Recomendado**: Adicionar testes de integração que validem a estrutura do banco antes de executar os workers

---

## 📝 Observações

- O projeto está usando **Supabase** como banco de dados (PostgreSQL)
- As migrações estão em `supabase/migrations/` mas não há migração inicial que crie a tabela `analyses`
- O schema está definido em `scripts/generate-sql.ts` mas pode não estar sincronizado com o banco real
- É necessário executar as migrações ou criar manualmente as tabelas no Supabase
