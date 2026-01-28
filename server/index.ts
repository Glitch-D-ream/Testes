import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initializeDatabase } from './core/database.ts';
import { setupRoutes } from './core/routes.ts';
import { compressionMiddleware } from './core/middleware.ts';
import { logInfo, logError } from './core/logger.ts';

// __filename e __dirname para compatibilidade com ES Modules em dev/prod
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import cookieParser from 'cookie-parser';
import { telegramWebhookService } from './services/telegram-webhook.service.ts';

// __filename e __dirname são injetados pelo esbuild via banner no build-server.js

const app = express();

// Confiar no proxy do Railway para o express-rate-limit funcionar corretamente
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compressionMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Configuração de CORS
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
  const origin = req.headers.origin;
  
  // CORS mais flexível para evitar bloqueios em produção/dev
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
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
// Em produção (dist/index.js), o frontend está em dist/public
// Em desenvolvimento (server/index.ts), o frontend está em client/dist
const clientBuildPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '../client/dist');

app.use(express.static(clientBuildPath));

// Inicializar aplicação
(async () => {
  logInfo('[Seth VII] Iniciando processo de inicialização...');
  logInfo(`[Seth VII] NODE_ENV: ${process.env.NODE_ENV}`);
  logInfo(`[Seth VII] PORT: ${PORT}`);
  logInfo(`[Seth VII] Client Build Path: ${clientBuildPath}`);

  try {
    // Inicializar banco de dados
    logInfo('[Seth VII] Inicializando banco de dados...');
    await initializeDatabase();
    logInfo('[Seth VII] Banco de dados inicializado.');

    // Configurar rotas da API
    logInfo('[Seth VII] Configurando rotas...');
    setupRoutes(app);

    // Rota de teste direto para verificar se o Express responde
    app.get('/ping', (req, res) => res.send('pong'));

    // Servir index.html para rotas não encontradas (SPA)
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
          res.status(500).send('Erro ao carregar o frontend. Verifique se o build foi concluído.');
        }
      });
    });

    // Iniciar servidor - Forçando 0.0.0.0 para garantir que o Railway consiga rotear o tráfego
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      logInfo(`[Seth VII] Servidor ouvindo em 0.0.0.0:${PORT}`);
      
      // Configurar webhook do Telegram se as variáveis estiverem definidas
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        logInfo('[Seth VII] Configurando webhook do Telegram...');
        telegramWebhookService.setWebhook().catch(err => 
          logError('Erro ao configurar webhook do Telegram:', err as Error)
        );
      }
    });

    server.on('error', (err) => {
      logError('[Seth VII] Erro no servidor HTTP:', err);
    });

  } catch (error) {
    logError('[Seth VII] Erro FATAL ao inicializar:', error as Error);
    process.exit(1);
  }
})();
