# 🔐 Guia de Configuração dos GitHub Secrets

**Projeto:** Seth VII - Detector de Promessas Políticas  
**Data:** 29 de Janeiro de 2026

---

## 📋 Visão Geral

Este guia detalha como configurar os **GitHub Secrets** necessários para que o **Scout Worker** (agente autônomo) funcione corretamente via GitHub Actions.

---

## 🎯 Secrets Necessários

O workflow `.github/workflows/scout.yml` requer os seguintes secrets:

| Nome do Secret | Descrição | Obrigatório |
|----------------|-----------|-------------|
| `SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase | ✅ Sim |
| `OPENROUTER_API_KEY` | Chave da OpenRouter (DeepSeek R1) | ⚠️ Recomendado |
| `GITHUB_TOKEN` | Token de acesso (gerado automaticamente) | ℹ️ Automático |

---

## 🚀 Passo a Passo para Configuração

### 1. Acessar Configurações do Repositório

```
URL: https://github.com/Glitch-D-ream/Testes/settings/secrets/actions
```

Ou navegue manualmente:
1. Acesse o repositório: https://github.com/Glitch-D-ream/Testes
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**

---

### 2. Adicionar Secret: SUPABASE_URL

1. Clique no botão **"New repository secret"**
2. Preencha os campos:
   - **Name:** `SUPABASE_URL`
   - **Secret:** `https://ceexfkjldhsbpugxvuyn.supabase.co`
3. Clique em **"Add secret"**

---

### 3. Adicionar Secret: SUPABASE_SERVICE_ROLE_KEY

1. Clique no botão **"New repository secret"**
2. Preencha os campos:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Secret:** `sb_secret_xsvh_x1Zog0FPn7urshqbA_IoiXBxR8`
3. Clique em **"Add secret"**

---

### 4. Adicionar Secret: OPENROUTER_API_KEY (Opcional mas Recomendado)

**Importante:** Este secret é necessário para usar o **DeepSeek R1** (modelo de IA principal). Sem ele, o sistema usará apenas os modelos de fallback (Pollinations AI e NLP local).

1. **Obter chave da OpenRouter:**
   - Acesse: https://openrouter.ai/
   - Faça login ou crie uma conta
   - Vá em **Keys** e crie uma nova API key
   - Copie a chave gerada

2. **Adicionar no GitHub:**
   - Clique no botão **"New repository secret"**
   - Preencha os campos:
     - **Name:** `OPENROUTER_API_KEY`
     - **Secret:** `[sua chave da OpenRouter]`
   - Clique em **"Add secret"**

---

### 5. Configurar Permissões do GITHUB_TOKEN

O `GITHUB_TOKEN` é gerado automaticamente pelo GitHub Actions, mas precisa ter permissões de **escrita** para commitar os dados coletados.

1. Acesse: https://github.com/Glitch-D-ream/Testes/settings/actions
2. Role até a seção **"Workflow permissions"**
3. Selecione: **"Read and write permissions"**
4. Marque a opção: **"Allow GitHub Actions to create and approve pull requests"** (opcional)
5. Clique em **"Save"**

---

## ✅ Verificação da Configuração

### Checklist de Secrets

Após configurar, verifique se todos os secrets estão presentes:

```
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ OPENROUTER_API_KEY (opcional)
✅ Permissões de escrita habilitadas
```

### Testar o Workflow Manualmente

1. Acesse: https://github.com/Glitch-D-ream/Testes/actions
2. Clique em **"Scout Worker (Autônomo)"** no menu lateral
3. Clique no botão **"Run workflow"**
4. Selecione a branch **"master"**
5. Clique em **"Run workflow"**

O workflow deve executar em aproximadamente 2-5 minutos. Verifique os logs para confirmar que não há erros de autenticação.

---

## 📊 Monitoramento do Scout Worker

### Execução Automática

O Scout Worker executa automaticamente **a cada 6 horas** conforme configurado no cron:

```yaml
schedule:
  - cron: '0 */6 * * *'  # 00:00, 06:00, 12:00, 18:00 UTC
```

### Verificar Execuções

1. Acesse: https://github.com/Glitch-D-ream/Testes/actions
2. Verifique a lista de execuções recentes
3. Clique em uma execução para ver os logs detalhados

### Dados Gerados

Após cada execução bem-sucedida, o Scout Worker cria/atualiza:

```
data/scout_history/
├── YYYY-MM-DD_HH-MM-SS.json  # Dados coletados
└── latest.json                # Última execução

logs/scout/
└── last_run.log               # Log da última execução
```

Esses arquivos são commitados automaticamente no repositório com a mensagem:
```
chore: update scout history and logs [skip ci]
```

---

## 🔒 Segurança dos Secrets

### Boas Práticas

1. **NUNCA** exponha secrets em logs ou código
2. **ROTACIONE** as chaves periodicamente (recomendado: 90 dias)
3. **MONITORE** o uso das chaves no painel do Supabase
4. **REVOGUE** imediatamente qualquer chave comprometida

### Como Rotacionar Secrets

#### Supabase Keys

1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/ceexfkjldhsbpugxvuyn
2. Vá em **Settings** → **API**
3. Clique em **"Reset service role key"**
4. Copie a nova chave
5. Atualize o secret `SUPABASE_SERVICE_ROLE_KEY` no GitHub

#### OpenRouter API Key

1. Acesse: https://openrouter.ai/keys
2. Revogue a chave antiga
3. Crie uma nova chave
4. Atualize o secret `OPENROUTER_API_KEY` no GitHub

---

## 🆘 Troubleshooting

### Erro: "Invalid API key" ou "Unauthorized"

**Causa:** Secret incorreto ou não configurado.

**Solução:**
1. Verifique se o secret existe em: https://github.com/Glitch-D-ream/Testes/settings/secrets/actions
2. Verifique se o nome do secret está correto (case-sensitive)
3. Verifique se não há espaços extras no valor do secret
4. Recrie o secret se necessário

---

### Erro: "Permission denied" ao commitar

**Causa:** GITHUB_TOKEN sem permissões de escrita.

**Solução:**
1. Acesse: https://github.com/Glitch-D-ream/Testes/settings/actions
2. Selecione **"Read and write permissions"**
3. Salve e execute o workflow novamente

---

### Erro: "Connection timeout" ao acessar Supabase

**Causa:** Projeto Supabase pausado ou URL incorreta.

**Solução:**
1. Acesse o painel do Supabase: https://supabase.com/dashboard/project/ceexfkjldhsbpugxvuyn
2. Verifique se o projeto está ativo (não pausado)
3. Verifique se a URL está correta no secret
4. Teste a conexão localmente com:
   ```bash
   curl https://ceexfkjldhsbpugxvuyn.supabase.co/rest/v1/
   ```

---

### Workflow não executa automaticamente

**Causa:** Cron do GitHub Actions pode ter atraso de até 15 minutos.

**Solução:**
1. Aguarde até 15 minutos após o horário agendado
2. Execute manualmente para testar: https://github.com/Glitch-D-ream/Testes/actions
3. Verifique se o workflow está habilitado (não desabilitado)

---

## 📝 Estrutura do Workflow

O arquivo `.github/workflows/scout.yml` utiliza os secrets da seguinte forma:

```yaml
- name: Executar Scout Worker
  env:
    NODE_ENV: production
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  run: pnpm tsx server/scripts/scout-worker.ts
```

---

## 🎯 Próximos Passos

Após configurar os secrets:

1. ✅ **Testar execução manual** do workflow
2. ✅ **Verificar logs** para confirmar sucesso
3. ✅ **Monitorar execuções automáticas** (a cada 6 horas)
4. ✅ **Verificar dados gerados** em `data/scout_history/`
5. ✅ **Configurar alertas** (opcional) para falhas no workflow

---

## 📚 Recursos Adicionais

- **Documentação GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Documentação Supabase API:** https://supabase.com/docs/guides/api
- **Documentação OpenRouter:** https://openrouter.ai/docs

---

**Documento criado por:** Seth VII Intelligence Unit  
**Última atualização:** 29 de Janeiro de 2026  
**Versão:** 1.0
