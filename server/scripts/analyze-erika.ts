
import { brainAgent } from '../agents/brain.ts';
import { logInfo, logError } from '../core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function runAnalysis() {
  const name = "Erika Hilton";
  logInfo(`🚀 Iniciando Auditoria Forense v3.1: ${name}`);

  try {
    const result = await brainAgent.analyze(name, "Nacional");
    logInfo("--- RESULTADO DA AUDITORIA ---");
    logInfo(`ID: ${result.id}`);
    logInfo(`Político: ${result.author}`);
    logInfo(`Score de Viabilidade: ${result.probabilityScore}%`);
    logInfo(`Promessas Extraídas: ${result.promisesCount}`);
    logInfo("------------------------------");
    process.exit(0);
  } catch (error) {
    logError("Erro fatal na análise:", error as Error);
    process.exit(1);
  }
}

runAnalysis();
