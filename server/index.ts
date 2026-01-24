import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './core/database.js';
import { setupRoutes } from './core/routes.js';
import cookieParser from 'cookie-parser';
import { telegramWebhookService } from './services/telegram-webhook.service.js';

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
// Em produção (dist/index.js), o frontend está em dist/public
// Em desenvolvimento (server/index.ts), o frontend está em client/dist
const clientBuildPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '../client/dist');

app.use(express.static(clientBuildPath));

// Inicializar aplicação
(async () => {
  console.log('[Detector de Promessa Vazia] Iniciando processo de inicialização...');
  console.log(`[Detector de Promessa Vazia] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Detector de Promessa Vazia] PORT: ${PORT}`);
  console.log(`[Detector de Promessa Vazia] Client Build Path: ${clientBuildPath}`);

  try {
    // Inicializar banco de dados
    console.log('[Detector de Promessa Vazia] Inicializando banco de dados...');
    await initializeDatabase();
    console.log('[Detector de Promessa Vazia] Banco de dados inicializado.');

    // Configurar rotas da API
    console.log('[Detector de Promessa Vazia] Configurando rotas...');
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
      console.log(`[Detector de Promessa Vazia] Servidor ouvindo em 0.0.0.0:${PORT}`);
      
      // Configurar webhook do Telegram se as variáveis estiverem definidas
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_DOMAIN) {
        console.log('[Detector de Promessa Vazia] Configurando webhook do Telegram...');
        telegramWebhookService.setWebhook().catch(err => 
          console.error('Erro ao configurar webhook do Telegram:', err)
        );
      }
    });

    server.on('error', (err) => {
      console.error('[Detector de Promessa Vazia] Erro no servidor HTTP:', err);
    });

  } catch (error) {
    console.error('[Detector de Promessa Vazia] Erro FATAL ao inicializar:', error);
    process.exit(1);
  }
})();
