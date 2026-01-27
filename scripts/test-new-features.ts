
import { multiScoutAgent } from '../server/agents/multi-scout.ts';
import { dossierService } from '../server/services/dossier.service.ts';
import { initializeDatabase } from '../server/core/database.ts';
import { logInfo, logError } from '../server/core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTests() {
  logInfo('🧪 Iniciando testes das novas funcionalidades...');

  try {
    await initializeDatabase();

    // 1. Testar Social Scout (Nitter/RSS)
    logInfo('\n--- Testando Social Scout (Nitter/RSS) ---');
    const politician = 'Lula'; // Nome comum para teste
    const socialSources = await (multiScoutAgent as any).searchViaSocialRSS(politician);
    
    if (socialSources.length > 0) {
      logInfo(`✅ Social Scout funcionou! Encontrou ${socialSources.length} posts.`);
      socialSources.slice(0, 2).forEach((s: any, i: number) => {
        logInfo(`   [${i+1}] ${s.title} - ${s.url}`);
      });
    } else {
      logInfo('⚠️ Social Scout não retornou resultados (pode ser bloqueio de instância ou perfil não encontrado).');
    }

    // 2. Testar Dossiê Automático
    logInfo('\n--- Testando Dossiê Automático ---');
    const dossier = await dossierService.generateDossier(politician);
    
    if (dossier) {
      logInfo(`✅ Dossiê gerado com sucesso para ${dossier.politicianName}!`);
      logInfo(`   Total de Análises: ${dossier.summary.totalAnalyses}`);
      logInfo(`   Probabilidade Média: ${dossier.summary.averageProbability}%`);
      logInfo(`   Categoria Principal: ${dossier.summary.mainCategory}`);
    } else {
      logInfo('ℹ️ Dossiê não gerado (provavelmente não há análises no banco para este político).');
    }

    logInfo('\n✅ Testes concluídos.');
    process.exit(0);
  } catch (error) {
    logError('❌ Erro durante os testes:', error as Error);
    process.exit(1);
  }
}

runTests();
