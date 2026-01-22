import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../server/core/database.js';
import { setupRoutes } from '../server/core/routes.js';
import cookieParser from 'cookie-parser';
import { telegramWebhookService } from '../server/services/telegram-webhook.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Servir arquivos estáticos do cliente
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Inicializar aplicação
(async () => {
  try {
    // Inicializar banco de dados
    await initializeDatabase();

    // Configurar rotas da API
    setupRoutes(app as any);

    // Servir index.html para rotas não encontradas (SPA)
    app.get('*', (req: any, res: any) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`[Detector de Promessa Vazia] Servidor iniciado em http://localhost:${PORT}`);
      
      // Configurar webhook do Telegram se as variáveis estiverem definidas
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        telegramWebhookService.setWebhook().catch(err => 
          console.error('Erro ao configurar webhook do Telegram:', err)
        );
      }
    });
  } catch (error) {
    console.error('[Detector de Promessa Vazia] Erro ao inicializar:', error);
    process.exit(1);
  }
})();

export default app;
