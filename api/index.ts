import express from 'express';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from '../server/core/database.js';
import { setupRoutes } from '../server/core/routes.js';
import { telegramWebhookService } from '../server/services/telegram-webhook.service.js';

const app = express();

// Middleware básico
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// CORS simplificado para produção
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-xsrf-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Inicialização síncrona das rotas (Vercel prefere assim)
setupRoutes(app);

// Inicialização assíncrona do banco e webhook
// No Vercel, isso roda na primeira requisição (cold start)
let isInitialized = false;
app.use(async (req, res, next) => {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        telegramWebhookService.setWebhook().catch(err => 
          console.error('Erro ao configurar webhook do Telegram:', err)
        );
      }
      
      isInitialized = true;
    } catch (error) {
      console.error('Erro na inicialização lazy:', error);
    }
  }
  next();
});

export default app;
