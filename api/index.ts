import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../server/core/database.js';
import { setupRoutes } from '../server/core/routes.js';
import cookieParser from 'cookie-parser';
import { telegramService } from '../server/services/telegram.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Configuração de CORS
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  const origin = req.headers.origin;
  
  if (process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-xsrf-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Inicializar aplicação
(async () => {
  try {
    await initializeDatabase();
    setupRoutes(app);
    
    // Iniciar Bot de Telegram (apenas se não estiver em ambiente serverless ou via webhook)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      telegramService.start().catch(err => console.error('Erro ao iniciar Telegram:', err));
    }
  } catch (error) {
    console.error('[Detector de Promessa Vazia] Erro ao inicializar:', error);
  }
})();

export default app;
