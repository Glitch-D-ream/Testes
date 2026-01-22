import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

// Carregar variáveis de ambiente
dotenv.config();

console.log('=== Teste Simplificado do Bot do Telegram ===\n');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;
const APP_URL = process.env.APP_URL;

// Verificar configuração
console.log('1. Verificando variáveis de ambiente:');
console.log('   TELEGRAM_BOT_TOKEN:', BOT_TOKEN ? '✅ Configurado' : '❌ Não configurado');
console.log('   WEBHOOK_DOMAIN:', WEBHOOK_DOMAIN ? `✅ ${WEBHOOK_DOMAIN}` : '❌ Não configurado');
console.log('   APP_URL:', APP_URL ? `✅ ${APP_URL}` : '❌ Não configurado');

if (!BOT_TOKEN) {
  console.log('\n❌ Bot não está configurado. Verifique as variáveis de ambiente.');
  console.log('\nPara configurar o bot:');
  console.log('1. Obtenha um token do @BotFather no Telegram');
  console.log('2. Adicione TELEGRAM_BOT_TOKEN no arquivo .env');
  console.log('3. Adicione WEBHOOK_DOMAIN (URL pública do servidor) se for usar webhook');
  console.log('4. Execute este script novamente');
  process.exit(1);
}

// Criar instância do bot
const bot = new Telegraf(BOT_TOKEN);

console.log('\n2. Testando conexão com a API do Telegram...');

// Obter informações do bot
bot.telegram.getMe()
  .then(botInfo => {
    console.log('   ✅ Conexão bem-sucedida!');
    console.log('   Nome do bot:', botInfo.first_name);
    console.log('   Username:', '@' + botInfo.username);
    console.log('   ID:', botInfo.id);
    
    // Obter informações do webhook
    return bot.telegram.getWebhookInfo();
  })
  .then(webhookInfo => {
    console.log('\n3. Informações do Webhook:');
    console.log('   URL configurada:', webhookInfo.url || 'Nenhuma (usando polling)');
    console.log('   Pending updates:', webhookInfo.pending_update_count);
    console.log('   Max connections:', webhookInfo.max_connections);
    
    if (webhookInfo.last_error_message) {
      console.log('   ⚠️  Último erro:', webhookInfo.last_error_message);
      console.log('   Data do erro:', new Date(webhookInfo.last_error_date! * 1000).toLocaleString());
    }
    
    if (!webhookInfo.url) {
      console.log('\n📝 Nota: O webhook não está configurado.');
      console.log('   Para ambientes serverless (Vercel), você precisa configurar o webhook.');
      console.log('   Para desenvolvimento local, você pode usar polling.');
      
      if (WEBHOOK_DOMAIN) {
        console.log('\n   Para configurar o webhook, execute:');
        console.log(`   curl -X POST ${WEBHOOK_DOMAIN}/api/telegram/set-webhook`);
      }
    } else {
      console.log('\n✅ Webhook está configurado e funcionando!');
      console.log('   O bot está pronto para receber mensagens.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Erro ao conectar com a API do Telegram:', err.message);
    
    if (err.message.includes('401')) {
      console.error('\n   O token fornecido é inválido. Verifique o TELEGRAM_BOT_TOKEN.');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
      console.error('\n   Problema de conexão com a internet ou com os servidores do Telegram.');
    }
    
    process.exit(1);
  });
