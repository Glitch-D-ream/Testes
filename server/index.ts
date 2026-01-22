import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './core/database.js';
import { setupRoutes } from './core/routes.js';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Servir arquivos estáticos do cliente
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Inicializar aplicação
(async () => {
  try {
    // Inicializar banco de dados
    await initializeDatabase();

    // Configurar rotas da API
    setupRoutes(app);

    // Servir index.html para rotas não encontradas (SPA)
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`[Detector de Promessa Vazia] Servidor iniciado em http://localhost:${PORT}`);
      console.log(`[Detector de Promessa Vazia] Ambiente: ${process.env.NODE_ENV || 'development'}`);
      
      // Iniciar Bot de Telegram
      telegramService.start();
    });
  } catch (error) {
    console.error('[Detector de Promessa Vazia] Erro ao inicializar:', error);
    process.exit(1);
  }
})();
