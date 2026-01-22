
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function checkBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token || token.includes('ABCdef')) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN não configurado ou usando valor padrão.');
    console.log('Para o bot funcionar, você precisa criar um no @BotFather e colocar o token no .env');
    return;
  }

  console.log('--- Verificando Status do Bot no Telegram ---');
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (response.data.ok) {
      const bot = response.data.result;
      console.log('✅ Bot Conectado com Sucesso!');
      console.log(`Nome: ${bot.first_name}`);
      console.log(`Username: @${bot.username}`);
    }
  } catch (error: any) {
    console.error('❌ Erro ao conectar com o Telegram:', error.response?.data?.description || error.message);
  }
}

checkBot().catch(console.error);
