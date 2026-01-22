import dotenv from 'dotenv';
import { telegramWebhookService } from './server/services/telegram-webhook.service.js';

// Carregar variáveis de ambiente
dotenv.config();

console.log('=== Teste do Bot do Telegram ===\n');

// Verificar configuração
console.log('1. Verificando configuração...');
console.log('   TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Configurado' : '❌ Não configurado');
console.log('   WEBHOOK_DOMAIN:', process.env.WEBHOOK_DOMAIN ? `✅ ${process.env.WEBHOOK_DOMAIN}` : '❌ Não configurado');
console.log('   APP_URL:', process.env.APP_URL ? `✅ ${process.env.APP_URL}` : '❌ Não configurado');
console.log('   Bot configurado:', telegramWebhookService.isConfigured() ? '✅ Sim' : '❌ Não');

// Se o bot estiver configurado, obter informações do webhook
if (telegramWebhookService.isConfigured()) {
  console.log('\n2. Obtendo informações do webhook...');
  
  telegramWebhookService.getWebhookInfo()
    .then(info => {
      console.log('   Webhook URL:', info?.url || 'Não configurado');
      console.log('   Pending updates:', info?.pending_update_count || 0);
      console.log('   Max connections:', info?.max_connections || 'N/A');
      console.log('   Last error:', info?.last_error_message || 'Nenhum erro');
      
      if (!info?.url && process.env.WEBHOOK_DOMAIN) {
        console.log('\n3. Webhook não configurado. Deseja configurar agora?');
        console.log('   Execute: curl -X POST http://localhost:3000/api/telegram/set-webhook');
      } else if (info?.url) {
        console.log('\n✅ Bot está configurado e pronto para receber mensagens!');
      }
    })
    .catch(err => {
      console.error('   ❌ Erro ao obter informações do webhook:', err.message);
    });
} else {
  console.log('\n❌ Bot não está configurado. Verifique as variáveis de ambiente.');
  console.log('\nPara configurar o bot:');
  console.log('1. Obtenha um token do @BotFather no Telegram');
  console.log('2. Adicione TELEGRAM_BOT_TOKEN no arquivo .env');
  console.log('3. Adicione WEBHOOK_DOMAIN (URL pública do servidor)');
  console.log('4. Execute este script novamente');
}
