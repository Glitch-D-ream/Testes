
import fs from 'fs';
import path from 'path';

/**
 * Script para corrigir problemas identificados nos logs do Railway:
 * 1. Configuração de 'trust proxy' para express-rate-limit
 * 2. Caminho do executável do Chromium para exportação de imagem
 */

const INDEX_PATH = path.resolve('server/index.ts');
const EXPORT_SERVICE_PATH = path.resolve('server/services/export.service.ts');

// 1. Corrigir 'trust proxy' no server/index.ts
if (fs.existsSync(INDEX_PATH)) {
  let content = fs.readFileSync(INDEX_PATH, 'utf8');
  if (!content.includes("app.set('trust proxy'")) {
    // Inserir após a criação do app
    content = content.replace(
      "const app = express();",
      "const app = express();\n\n// Confiar no proxy do Railway para o express-rate-limit funcionar corretamente\napp.set('trust proxy', 1);"
    );
    fs.writeFileSync(INDEX_PATH, content);
    console.log('✅ Configuração trust proxy adicionada ao server/index.ts');
  } else {
    console.log('ℹ️ Configuração trust proxy já existe.');
  }
}

// 2. Corrigir caminho do Chromium no server/services/export.service.ts
if (fs.existsSync(EXPORT_SERVICE_PATH)) {
  let content = fs.readFileSync(EXPORT_SERVICE_PATH, 'utf8');
  
  // No Railway (Nixpacks), o Chromium geralmente não está em /usr/bin/chromium-browser
  // O ideal é remover o executablePath fixo e deixar o puppeteer encontrar ou usar uma variável de ambiente
  const oldPath = "executablePath: '/usr/bin/chromium-browser'";
  const newPath = "executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined";
  
  if (content.includes(oldPath)) {
    content = content.replace(oldPath, newPath);
    fs.writeFileSync(EXPORT_SERVICE_PATH, content);
    console.log('✅ Caminho do Chromium atualizado no server/services/export.service.ts');
  } else {
    console.log('ℹ️ Caminho do Chromium já está atualizado ou não foi encontrado.');
  }
}

console.log('\n🚀 Correções aplicadas localmente. Por favor, faça o commit e push para o GitHub para aplicar no Railway.');
