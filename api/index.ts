import express from 'express';
import { initializeDatabase } from '../server/core/database.js';
import { setupRoutes } from '../server/core/routes.js';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Configuração de CORS
app.use((req: any, res: any, next: any) => {
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

// Inicializar aplicação de forma assíncrona para Serverless
let isInitialized = false;
const initPromise = (async () => {
  if (isInitialized) return;
  try {
    await initializeDatabase();
    setupRoutes(app as any);
    isInitialized = true;
    console.log('[Detector de Promessa Vazia] API Inicializada');
  } catch (error) {
    console.error('[Detector de Promessa Vazia] Erro ao inicializar:', error);
  }
})();

// Middleware para garantir inicialização
app.use(async (req, res, next) => {
  await initPromise;
  next();
});

export default app;
