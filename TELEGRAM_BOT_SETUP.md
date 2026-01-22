# Configuração do Bot do Telegram - Detector de Promessa Vazia

Este guia explica como configurar o bot do Telegram para funcionar corretamente em ambiente serverless (Vercel).

## 🔧 Mudanças Implementadas

### Problema Original
O bot estava usando **polling** (`bot.launch()`), que requer um processo Node.js rodando continuamente. Isso não funciona em ambientes serverless como o Vercel, onde as funções são executadas sob demanda e encerradas após cada requisição.

### Solução Implementada
Migração para **webhook**, onde o Telegram envia as mensagens diretamente para um endpoint da API.

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
1. **`server/services/telegram-webhook.service.ts`** - Serviço de webhook do Telegram
2. **`server/routes/telegram.routes.ts`** - Rotas para gerenciar o webhook
3. **`TELEGRAM_BOT_SETUP.md`** - Esta documentação

### Arquivos Modificados:
1. **`server/core/routes.ts`** - Adicionadas rotas do Telegram
2. **`api/index.ts`** - Atualizado para usar webhook
3. **`server/index.ts`** - Atualizado para usar webhook

## 🚀 Como Configurar

### 1. Obter o Token do Bot

Se você ainda não tem um bot do Telegram:

1. Abra o Telegram e procure por **@BotFather**
2. Envie o comando `/newbot`
3. Siga as instruções para criar seu bot
4. Copie o **token** fornecido (formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configurar Variáveis de Ambiente no Vercel

Acesse o painel do Vercel e adicione as seguintes variáveis de ambiente:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `TELEGRAM_BOT_TOKEN` | `seu_token_aqui` | Token obtido do BotFather |
| `WEBHOOK_DOMAIN` | `https://seu-dominio.vercel.app` | URL pública do seu projeto no Vercel |
| `APP_URL` | `https://seu-dominio.vercel.app` | URL do frontend (para gerar links nas respostas) |

**Importante:** Não inclua barra `/` no final das URLs.

### 3. Fazer Deploy no Vercel

Após configurar as variáveis de ambiente:

```bash
# Commit e push das mudanças
git add .
git commit -m "feat: implementar webhook do Telegram para ambiente serverless"
git push origin main
```

O Vercel fará o deploy automaticamente.

### 4. Configurar o Webhook

Após o deploy, o webhook será configurado automaticamente. Para verificar:

**Opção A: Verificar via API**
```bash
curl https://seu-dominio.vercel.app/api/telegram/webhook-info
```

**Opção B: Configurar manualmente (se necessário)**
```bash
curl -X POST https://seu-dominio.vercel.app/api/telegram/set-webhook
```

### 5. Testar o Bot

1. Abra o Telegram
2. Procure pelo seu bot (nome que você definiu no BotFather)
3. Envie `/start`
4. Envie um texto político para análise

## 📡 Endpoints Disponíveis

### `POST /api/telegram/webhook`
Recebe updates do Telegram (usado automaticamente pelo Telegram).

### `POST /api/telegram/set-webhook`
Configura o webhook manualmente.

**Exemplo:**
```bash
curl -X POST https://seu-dominio.vercel.app/api/telegram/set-webhook
```

### `DELETE /api/telegram/webhook`
Remove o webhook.

**Exemplo:**
```bash
curl -X DELETE https://seu-dominio.vercel.app/api/telegram/webhook
```

### `GET /api/telegram/webhook-info`
Obtém informações sobre o webhook atual.

**Exemplo:**
```bash
curl https://seu-dominio.vercel.app/api/telegram/webhook-info
```

**Resposta:**
```json
{
  "configured": true,
  "webhookInfo": {
    "url": "https://seu-dominio.vercel.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

### `GET /api/telegram/status`
Verifica o status do bot.

**Exemplo:**
```bash
curl https://seu-dominio.vercel.app/api/telegram/status
```

**Resposta:**
```json
{
  "configured": true,
  "webhookSet": true,
  "hasToken": true,
  "hasDomain": true
}
```

## 🔍 Troubleshooting

### Bot não responde

1. **Verificar variáveis de ambiente:**
```bash
curl https://seu-dominio.vercel.app/api/telegram/status
```

Se `hasToken` ou `hasDomain` for `false`, verifique as variáveis de ambiente no Vercel.

2. **Verificar webhook:**
```bash
curl https://seu-dominio.vercel.app/api/telegram/webhook-info
```

Se o webhook não estiver configurado, execute:
```bash
curl -X POST https://seu-dominio.vercel.app/api/telegram/set-webhook
```

3. **Verificar logs no Vercel:**
- Acesse o painel do Vercel
- Vá em "Logs" ou "Functions"
- Procure por erros relacionados ao Telegram

### Webhook não está sendo configurado

Certifique-se de que:
- `TELEGRAM_BOT_TOKEN` está correto
- `WEBHOOK_DOMAIN` está correto (sem barra no final)
- O domínio é HTTPS (obrigatório para webhooks do Telegram)
- O deploy foi concluído com sucesso

### Mensagens não estão sendo processadas

1. Verifique se o endpoint está respondendo:
```bash
curl -X POST https://seu-dominio.vercel.app/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"text": "test"}}'
```

2. Verifique os logs no Vercel para erros

## 🔐 Segurança

### Recomendações:

1. **Validar origem das requisições:** O Telegram envia um header `X-Telegram-Bot-Api-Secret-Token` que pode ser usado para validar requisições.

2. **Rate limiting:** As rotas do webhook já estão protegidas pelo rate limiting global da aplicação.

3. **Não expor o token:** Nunca commite o token no código. Use sempre variáveis de ambiente.

## 📊 Monitoramento

Para monitorar o uso do bot:

1. **Logs do Vercel:** Acesse o painel do Vercel > Logs
2. **Telegram API:** Use `getWebhookInfo()` para ver estatísticas
3. **Analytics:** Implemente tracking de uso no código (opcional)

## 🔄 Migração do Polling para Webhook

Se você estava usando polling antes, a migração já foi feita automaticamente. O serviço antigo (`telegram.service.ts`) ainda existe mas não é mais usado.

### Diferenças:

| Polling | Webhook |
|---------|---------|
| Servidor consulta Telegram constantemente | Telegram envia mensagens para o servidor |
| Requer processo contínuo | Funciona em serverless |
| Maior latência | Menor latência |
| Mais requisições | Menos requisições |
| ❌ Não funciona no Vercel | ✅ Funciona no Vercel |

## 📚 Referências

- [Telegram Bot API - Webhooks](https://core.telegram.org/bots/api#setwebhook)
- [Telegraf.js Documentation](https://telegraf.js.org/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

## 💡 Dicas

1. **Desenvolvimento local:** Para testar localmente, use [ngrok](https://ngrok.com/) para expor seu servidor local:
```bash
ngrok http 3000
# Use a URL do ngrok como WEBHOOK_DOMAIN
```

2. **Múltiplos ambientes:** Use diferentes bots para desenvolvimento e produção.

3. **Logs:** Sempre verifique os logs do Vercel para debugar problemas.

---

**Desenvolvido para o Detector de Promessa Vazia** 🔍
