
import { scrapingQueue, processingQueue } from './index.ts';
import { scoutAgent } from '../agents/scout.ts';
import { logInfo, logError } from '../core/logger.ts';
import { getDeputadoId, getVotacoesDeputado, getProposicoesDeputado } from '../integrations/camara.ts';
import { getSenadorCodigo, getVotacoesSenador, getMateriasSenador } from '../integrations/senado.ts';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Worker de Scraping
 * Consome jobs da scrapingQueue e realiza a coleta de dados.
 */
scrapingQueue.process(2, async (job) => {
  const { politicianName } = job.data;
  logInfo(`👷 [Worker] Processando scraping para: ${politicianName}`);

  try {
    // 1. Coleta de Notícias (Scout)
    const results = await scoutAgent.search(politicianName, true);
    logInfo(`✨ [Worker] Encontradas ${results.length} fontes para ${politicianName}`);

    // 2. Sincronização Governamental
    await syncGovernmentData(politicianName);

    // 3. Salvar no Cold Storage
    if (results.length > 0) {
      await saveToColdStorage(politicianName, results);
      
      // 4. Encaminhar para a próxima fila (Processamento/Normalização)
      await processingQueue.add({
        politicianName,
        data: results,
        timestamp: new Date().toISOString()
      });
    }

    return { success: true, count: results.length };
  } catch (error) {
    logError(`❌ [Worker] Erro ao processar scraping de ${politicianName}:`, error as Error);
    throw error; // Permite o retry do Bull
  }
});

async function syncGovernmentData(name: string) {
  // Tentar Câmara
  const deputadoId = await getDeputadoId(name);
  if (deputadoId) {
    await Promise.all([
      getVotacoesDeputado(deputadoId),
      getProposicoesDeputado(deputadoId)
    ]);
  }

  // Tentar Senado
  const senadorId = await getSenadorCodigo(name);
  if (senadorId) {
    await Promise.all([
      getVotacoesSenador(senadorId),
      getMateriasSenador(senadorId)
    ]);
  }
}

async function saveToColdStorage(name: string, results: any[]) {
  const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  const dirPath = path.join(process.cwd(), 'data', 'scout_history');
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, fileName);
  let dataToSave = results;

  if (fs.existsSync(filePath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const existingUrls = new Set(existingData.map((item: any) => item.url));
      const newItems = results.filter(item => !existingUrls.has(item.url));
      dataToSave = [...existingData, ...newItems];
    } catch (e) {
      logError(`Erro no merge de cold storage para ${name}:`, e as Error);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
}

logInfo('👷 Worker de Scraping ativo e aguardando jobs...');
