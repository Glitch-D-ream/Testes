
import { scoutAgent } from '../agents/scout.ts';
import { getSupabase, initializeDatabase } from '../core/database.ts';
import { logInfo, logError } from '../core/logger.ts';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Scout Worker Independente
 * Este script é projetado para rodar no GitHub Actions.
 * Ele busca notícias de políticos cadastrados e salva no Supabase.
 */
async function runScoutWorker() {
  logInfo('🚀 Iniciando Scout Worker Independente...');

  try {
    // 1. Inicializar conexão com o banco
    await initializeDatabase();
    const supabase = getSupabase();

    // 2. Buscar lista de políticos ativos para monitorar
    const { data: politicians, error: polError } = await supabase
      .from('politicians')
      .select('name')
      .limit(10); // Limite inicial para não estourar o tempo do worker

    if (polError) {
      logError('Erro ao buscar políticos:', polError as any);
    }

    if (!politicians || politicians.length === 0) {
      // Se não houver políticos, vamos usar uma lista padrão para teste
      const defaultPoliticians = ['Erika Hilton', 'Jones Manoel', 'Nikolas Ferreira', 'Lula', 'Bolsonaro'];
      logInfo(`Nenhum político encontrado no banco. Usando lista padrão: ${defaultPoliticians.join(', ')}`);
      
      for (const name of defaultPoliticians) {
        await processPolitician(name);
      }
    } else {
      logInfo(`Monitorando ${politicians.length} políticos encontrados no banco.`);
      for (const p of politicians) {
        await processPolitician(p.name);
      }
    }

    logInfo('✅ Scout Worker concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    logError('Erro fatal no Scout Worker:', error as Error);
    process.exit(1);
  }
}

async function processPolitician(name: string) {
  logInfo(`🔍 Buscando dados para: ${name}`);
  try {
    // O ScoutAgent já salva no banco internamente via saveScoutHistory
    const results = await scoutAgent.search(name, true);
    logInfo(`✨ Encontradas ${results.length} fontes para ${name}`);

    // Cold Storage: Salvar resultados em JSON para o GitHub
    if (results.length > 0) {
      const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      const dirPath = path.join(process.cwd(), 'data', 'scout_history');
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const filePath = path.join(dirPath, fileName);
      
      // Se o arquivo já existir, ler e fazer merge para não perder dados do mesmo dia
      let dataToSave = results;
      if (fs.existsSync(filePath)) {
        try {
          const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const existingUrls = new Set(existingData.map((item: any) => item.url));
          const newItems = results.filter(item => !existingUrls.has(item.url));
          dataToSave = [...existingData, ...newItems];
        } catch (e) {
          logError(`Erro ao ler arquivo existente para ${name}:`, e as Error);
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
      logInfo(`💾 Dados salvos no Cold Storage: ${fileName}`);
    }
  } catch (error) {
    logError(`Erro ao processar ${name}:`, error as Error);
  }
}

// Executar o worker
runScoutWorker();
