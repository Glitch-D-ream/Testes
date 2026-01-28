
import { brainAgent } from '../agents/brain.ts';
import { logInfo, logError } from '../core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function runAnalysis() {
  const name = "Erika Hilton";
  logInfo(`🚀 Iniciando Auditoria Forense v3.1: ${name}`);

  try {
    const result = await brainAgent.analyze(name, "Nacional");
    console.log("\n--- RESULTADO DA AUDITORIA ---");
    console.log(`ID: ${result.id}`);
    console.log(`Político: ${result.author}`);
    console.log(`Score de Viabilidade: ${result.probabilityScore}%`);
    console.log(`Promessas Extraídas: ${result.promisesCount}`);
    console.log("------------------------------\n");
    process.exit(0);
  } catch (error) {
    logError("Erro fatal na análise:", error as Error);
    process.exit(1);
  }
}

runAnalysis();
