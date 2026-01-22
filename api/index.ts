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

// CORS simplificado
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-xsrf-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Inicialização lazy do banco e webhook
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    try {
      await initializeDatabase();
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        await telegramWebhookService.setWebhook();
      }
      isInitialized = true;
    } catch (error) {
      console.error('Erro na inicialização:', error);
    }
  }
}

// Configurar rotas do servidor
setupRoutes(app);

// Handler principal para o Vercel
export default async (req: any, res: any) => {
  await ensureInitialized();
  return app(req, res);
};
