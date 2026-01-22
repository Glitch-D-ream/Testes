import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from '../server/core/database.js';
import { setupRoutes } from '../server/core/routes.js';
import { telegramWebhookService } from '../server/services/telegram-webhook.service.js';

const app = express();

// Configurações básicas de middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Middleware de Log e Normalização de URL para o Vercel
app.use((req: Request, res: Response, next: NextFunction) => {
  // No Vercel, as requisições para /api/xxx podem chegar ao handler como /xxx
  // ou /api/xxx dependendo da configuração de rewrites.
  // Garantimos que o Express sempre veja o prefixo /api para bater com setupRoutes.
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  console.log(`[Vercel-API] ${req.method} ${req.url}`);
  next();
});

// Configuração de CORS para produção
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-xsrf-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Inicialização das rotas do servidor
setupRoutes(app);

// Estado de inicialização global (persiste entre invocações quentes do Lambda)
let isInitialized = false;

export default async (req: Request, res: Response) => {
  try {
    if (!isInitialized) {
      console.log('[Vercel-API] Inicializando recursos (DB, Webhook)...');
      await initializeDatabase();
      
      // Configuração do Webhook do Telegram
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        const success = await telegramWebhookService.setWebhook();
        console.log(`[Vercel-API] Webhook do Telegram configurado: ${success}`);
      }
      
      isInitialized = true;
    }
    
    // Delegar a requisição para o app Express
    return app(req, res);
  } catch (error) {
    console.error('[Vercel-API] Erro crítico no handler:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
  }
};
