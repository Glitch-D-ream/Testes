# 🔧 Guia de Correção - GitHub Actions (Seth VII)

Este guia fornece instruções passo a passo para corrigir os problemas identificados nas GitHub Actions.

---

## 📋 Problemas Identificados

1. ✅ **Super-Orchestrator**: Versão incorreta do Node.js (corrigido)
2. ⚠️ **Dual-Chain Worker**: Coluna `ai_verdict_local` não existe no banco de dados

---

## 🎯 Correção 1: Super-Orchestrator (CONCLUÍDA)

### O que foi feito

O arquivo `.github/workflows/super-orchestrator.yml` foi corrigido:

**Mudança aplicada**:
```yaml
# Linha 21 - ANTES
node-version: '20'

# Linha 21 - DEPOIS
node-version: '22'
```

### Próximos passos

1. **Fazer commit das mudanças**:
```bash
cd /home/ubuntu/Testes
git add .github/workflows/super-orchestrator.yml
git commit -m "fix: update Node.js version to 22 in super-orchestrator workflow"
git push origin master
```

2. **Testar o workflow**:
   - Acesse o repositório no GitHub
   - Vá em Actions → Super Orchestrator
   - Execute manualmente ou aguarde o próximo trigger

---

## 🎯 Correção 2: Adicionar Coluna ai_verdict_local

### Opção A: Aplicar via Supabase Dashboard (RECOMENDADO)

1. **Acessar o Supabase Dashboard**:
   - URL: https://supabase.com/dashboard
   - Projeto: `ceexfkjldhsbpugxvuyn`

2. **Abrir SQL Editor**:
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Executar a migração**:
   - Copie o conteúdo do arquivo: `supabase/migrations/20260201000001_add_ai_verdict_local.sql`
   - Cole no editor SQL
   - Clique em "Run" ou pressione Ctrl+Enter

4. **Verificar se funcionou**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;
```

Você deve ver a coluna `ai_verdict_local` com tipo `jsonb`.

---

### Opção B: Aplicar via Script TypeScript

1. **Executar o script de migração**:
```bash
cd /home/ubuntu/Testes
npx tsx apply-migration.ts
```

2. **Verificar logs**:
   - O script tentará executar cada comando SQL
   - Verifique se há erros

---

### Opção C: Aplicar via Supabase CLI

1. **Instalar Supabase CLI** (se não estiver instalado):
```bash
npm install -g supabase
```

2. **Fazer login**:
```bash
supabase login
```

3. **Linkar o projeto**:
```bash
cd /home/ubuntu/Testes
supabase link --project-ref ceexfkjldhsbpugxvuyn
```

4. **Aplicar migrações**:
```bash
supabase db push
```

---

## 🔐 Configurar Secrets do GitHub

Verifique se os seguintes secrets estão configurados no repositório:

1. **Acessar Settings → Secrets and variables → Actions**

2. **Adicionar/Verificar os seguintes secrets**:

| Nome | Valor | Usado por |
|------|-------|-----------|
| `SUPABASE_URL` | `https://ceexfkjldhsbpugxvuyn.supabase.co` | Todos os workflows |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8` | Todos os workflows |
| `GH_TOKEN_CUSTOM` | `ghp_[SEU_TOKEN_AQUI]` | Dual-Chain Worker |
| `OPENAI_API_KEY` | (opcional) | Super-Orchestrator |
| `GEMINI_API_KEY` | (opcional) | Super-Orchestrator |
| `HUGGINGFACE_TOKEN` | (opcional) | Super-Orchestrator |

---

## 🧪 Testar as Correções

### Teste 1: Super-Orchestrator

1. **Disparar manualmente**:
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Glitch-D-ream/Testes/dispatches \
  -d '{"event_type":"run-super-orchestrator","client_payload":{"politicianName":"Erika Hilton","analysisId":"TEST_001","state":"SP"}}'
```

2. **Verificar logs**:
   - Acesse: https://github.com/Glitch-D-ream/Testes/actions
   - Clique na execução mais recente
   - Verifique se não há mais erros de módulo ESM

### Teste 2: Dual-Chain Worker

1. **Criar uma análise de teste no Supabase**:
```sql
INSERT INTO analyses (id, text, author, status, progress)
VALUES ('TEST_DUAL_CHAIN_001', 'Texto de teste', 'Político Teste', 'pending', 0);
```

2. **Disparar o workflow**:
```bash
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/Glitch-D-ream/Testes/dispatches \
  -d '{"event_type":"start-dual-chain-analysis","client_payload":{"analysis_id":"TEST_DUAL_CHAIN_001"}}'
```

3. **Verificar resultado**:
```sql
SELECT id, status, ai_verdict_local 
FROM analyses 
WHERE id = 'TEST_DUAL_CHAIN_001';
```

---

## 📝 Checklist Final

- [ ] Versão do Node.js corrigida para 22 no super-orchestrator.yml
- [ ] Commit e push das alterações no workflow
- [ ] Coluna `ai_verdict_local` adicionada à tabela `analyses`
- [ ] Secrets configurados no GitHub Actions
- [ ] Teste do Super-Orchestrator executado com sucesso
- [ ] Teste do Dual-Chain Worker executado com sucesso
- [ ] Documentação atualizada (se necessário)

---

## 🆘 Troubleshooting

### Erro: "Could not find the 'ai_verdict_local' column"

**Causa**: A migração não foi aplicada ou falhou.

**Solução**:
1. Verifique se a coluna existe:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'analyses' AND column_name = 'ai_verdict_local';
```

2. Se não existir, execute manualmente:
```sql
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS ai_verdict_local JSONB;
```

### Erro: "triggerUncaughtException" no Super-Orchestrator

**Causa**: Problema com módulos ESM ou dependências.

**Solução**:
1. Verifique se a versão do Node.js está correta (22)
2. Verifique se o comando está usando `npx tsx` (linha 57 do workflow)
3. Limpe o cache do pnpm:
```yaml
- name: Clear pnpm cache
  run: pnpm store prune
```

### Erro: "PGRST204" no Dual-Chain Worker

**Causa**: Schema cache do Supabase desatualizado.

**Solução**:
1. Force refresh do schema cache via Dashboard
2. Ou execute:
```sql
NOTIFY pgrst, 'reload schema';
```

---

## 📞 Suporte

Se os problemas persistirem:

1. Verifique os logs completos das GitHub Actions
2. Verifique a estrutura do banco de dados no Supabase Dashboard
3. Teste os scripts localmente antes de executar nas Actions
4. Consulte a documentação do Supabase: https://supabase.com/docs

---

**Última atualização**: 01 de Fevereiro de 2026
