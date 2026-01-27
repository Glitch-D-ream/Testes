
import { brainAgent } from '../agents/brain.ts';
import { logInfo, logError } from '../core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function runAnalysis() {
  const politician = "Arthur Lira";
  console.log(`\n=== INICIANDO AUDITORIA SETH VII (IRONCLAD v2.5): ${politician} ===\n`);

  try {
    const startTime = Date.now();
    const result = await brainAgent.analyze(politician);
    const duration = ((Date.now() - startTime)/1000).toFixed(2);
    
    console.log(`\n✅ AUDITORIA CONCLUÍDA EM ${duration}s`);
    console.log(`Político: ${result.politicianName}`);
    console.log(`Linhagem de Dados: ${JSON.stringify(result.dataLineage)}`);
  } catch (error: any) {
    console.error(`\n❌ FALHA NA AUDITORIA: ${error.message}`);
    process.exit(1);
  }
}

runAnalysis().then(() => process.exit(0));
