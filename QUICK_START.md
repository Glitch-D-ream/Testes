# 🚀 Guia Rápido - Configuração do Bot do Telegram

Este guia mostra como configurar o bot do Telegram em **5 minutos**.

## ✅ Pré-requisitos

- [ ] Conta no [Vercel](https://vercel.com)
- [ ] Conta no [Supabase](https://supabase.com) (para banco de dados)
- [ ] Token do bot do Telegram (obter com @BotFather)

## 📋 Passo a Passo

### 1️⃣ Obter Token do Bot (2 min)

1. Abra o Telegram
2. Procure por **@BotFather**
3. Envie `/newbot`
4. Siga as instruções
5. **Copie o token** (formato: `123456789:ABC...`)

### 2️⃣ Configurar Banco de Dados no Supabase (1 min)

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** > **Database**
4. Copie a **Connection String** (URI)

### 3️⃣ Configurar Variáveis no Vercel (2 min)

Acesse seu projeto no Vercel > **Settings** > **Environment Variables** e adicione:

| Nome | Valor | Onde obter |
|------|-------|------------|
| `TELEGRAM_BOT_TOKEN` | `123456789:ABC...` | BotFather no Telegram |
| `WEBHOOK_DOMAIN` | `https://seu-app.vercel.app` | URL do seu projeto no Vercel |
| `APP_URL` | `https://seu-app.vercel.app` | Mesma URL acima |
| `DATABASE_URL` | `postgresql://...` | Supabase > Settings > Database |
| `JWT_SECRET` | `string-aleatoria-segura` | Gere uma string aleatória |

**Dica:** Para gerar `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4️⃣ Fazer Deploy (automático)

O Vercel fará deploy automaticamente após o push no GitHub. Aguarde a conclusão.

### 5️⃣ Configurar Webhook (30 seg)

Após o deploy, configure o webhook:

```bash
curl -X POST https://seu-app.vercel.app/api/telegram/set-webhook
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Webhook configurado com sucesso"
}
```

### 6️⃣ Testar o Bot (30 seg)

1. Abra o Telegram
2. Procure pelo seu bot
3. Envie `/start`
4. Envie um texto político para análise

## 🔍 Verificar se está funcionando

### Verificar status do bot:
```bash
curl https://seu-app.vercel.app/api/telegram/status
```

**Resposta esperada:**
```json
{
  "configured": true,
  "webhookSet": true,
  "hasToken": true,
  "hasDomain": true
}
```

### Verificar informações do webhook:
```bash
curl https://seu-app.vercel.app/api/telegram/webhook-info
```

## ❌ Problemas Comuns

### Bot não responde

**Solução 1:** Verificar variáveis de ambiente
```bash
curl https://seu-app.vercel.app/api/telegram/status
```

Se algum campo for `false`, revise as variáveis no Vercel.

**Solução 2:** Reconfigurar webhook
```bash
# Remover webhook antigo
curl -X DELETE https://seu-app.vercel.app/api/telegram/webhook

# Configurar novamente
curl -X POST https://seu-app.vercel.app/api/telegram/set-webhook
```

**Solução 3:** Verificar logs no Vercel
- Acesse Vercel Dashboard
- Vá em **Functions** ou **Logs**
- Procure por erros

### Webhook não configura

Certifique-se de que:
- ✅ `TELEGRAM_BOT_TOKEN` está correto
- ✅ `WEBHOOK_DOMAIN` está correto (sem `/` no final)
- ✅ URL é HTTPS (obrigatório)
- ✅ Deploy foi concluído

### Erro de banco de dados

Verifique se:
- ✅ `DATABASE_URL` está correto
- ✅ Banco de dados está acessível
- ✅ Schema foi aplicado (rode migrations)

## 🎉 Pronto!

Seu bot está funcionando! Agora você pode:

- Enviar textos políticos para análise
- Receber scores de viabilidade
- Ver análises completas no site

## 📚 Documentação Completa

Para mais detalhes, consulte:
- [TELEGRAM_BOT_SETUP.md](./TELEGRAM_BOT_SETUP.md) - Documentação completa
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guia de deployment
- [README.md](./README.md) - Visão geral do projeto

## 🆘 Precisa de Ajuda?

1. Verifique os logs no Vercel
2. Consulte [TELEGRAM_BOT_SETUP.md](./TELEGRAM_BOT_SETUP.md)
3. Abra uma [issue no GitHub](https://github.com/Glitch-D-ream/Testes/issues)

---

**Desenvolvido com ❤️ para transparência política**
