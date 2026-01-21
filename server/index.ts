import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './core/database.js';
import { setupRoutes } from './core/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS para desenvolvimento
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    });
  } catch (error) {
    console.error('[Detector de Promessa Vazia] Erro ao inicializar:', error);
    process.exit(1);
  }
})();
