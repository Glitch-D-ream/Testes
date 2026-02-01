
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const MODELS_DIR = path.join(process.cwd(), 'server/models/bin');

const MODELS = [
  {
    name: 'DeepSeek-R1-Distill-Qwen-1.5B-GGUF',
    url: 'https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
    filename: 'deepseek-r1-1.5b.gguf'
  },
  {
    name: 'Qwen2.5-1.5B-Instruct-GGUF',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    filename: 'qwen2.5-1.5b.gguf'
  }
];

async function setup() {
  console.log('🚀 Iniciando Setup de Modelos de IA para Dual-Chain...');

  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
  }

  for (const model of MODELS) {
    const targetPath = path.join(MODELS_DIR, model.filename);

    if (fs.existsSync(targetPath)) {
      console.log(`✅ Modelo ${model.name} já existe. Pulando download.`);
      continue;
    }

    console.log(`📥 Baixando ${model.name}...`);
    try {
      // Usando wget para download direto e rápido
      execSync(`wget -O "${targetPath}" "${model.url}"`, { stdio: 'inherit' });
      console.log(`✅ ${model.name} baixado com sucesso.`);
    } catch (error) {
      console.error(`❌ Erno no download de ${model.name}:`, error);
      process.exit(1);
    }
  }

  console.log('✨ Todos os modelos estão prontos para a Dual-Chain!');
}

setup();
