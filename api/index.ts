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

// Middleware de log para depuração no Vercel
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

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
        // Tentar configurar o webhook de forma assíncrona para não atrasar a resposta
        telegramWebhookService.setWebhook().catch(err => console.error('Erro ao configurar webhook:', err));
      }
      isInitialized = true;
    } catch (error) {
      console.error('Erro na inicialização:', error);
    }
  }
}

// Configurar rotas do servidor (elas esperam o prefixo /api)
setupRoutes(app);

// Handler principal para o Vercel
export default async (req: any, res: any) => {
  await ensureInitialized();
  
  // No Vercel, o req.url pode vir sem o prefixo /api dependendo da configuração.
  // Se vier como /health mas o Express espera /api/health, precisamos ajustar.
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  
  return app(req, res);
};
