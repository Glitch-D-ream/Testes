
import { brainAgent } from '../server/agents/brain.ts';
import { initializeDatabase } from '../server/core/database.ts';
import { logInfo, logError } from '../server/core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTriadTest() {
  logInfo('🚀 Iniciando Execução da Tríade Seth VII: Jones Manoel');
  
  try {
    // 1. Inicializar Banco
    await initializeDatabase();
    
    // 2. Executar Brain Agent (que orquestra Scout e Filter internamente)
    const politician = "Jones Manoel";
    logInfo(`🧠 Ativando Brain Agent para auditoria de: ${politician}`);
    
    const start = Date.now();
    const result = await brainAgent.analyze(politician);
    const end = Date.now();
    
    logInfo(`✅ Auditoria concluída em ${((end - start) / 1000).toFixed(2)}s.`);
    
    // 3. Exibir Resultados Detalhados
    console.log('\n' + '█'.repeat(60));
    console.log('🛡️  RELATÓRIO DE AUDITORIA TÉCNICA - SETH VII');
    console.log('█'.repeat(60));
    
    console.log(`\n👤 POLÍTICO: ${result.politicianName}`);
    console.log(`🏢 CARGO: ${result.politician.office} | PARTIDO: ${result.politician.party}`);
    console.log(`📊 CATEGORIA PRINCIPAL: ${result.mainCategory}`);
    
    console.log('\n' + '-'.repeat(60));
    console.log('📝 PARECER TÉCNICO (BRAIN VERDICT):');
    console.log('-'.repeat(60));
    // O parecer técnico está em aiAnalysis no saveAnalysis, mas o analyze retorna dataSources
    // Vamos tentar encontrar o parecer no objeto retornado
    console.log((result as any).aiAnalysis || "Parecer gerado e salvo no banco de dados.");
    
    console.log('\n' + '-'.repeat(60));
    console.log('💰 VEREDITO ORÇAMENTÁRIO (SICONFI):');
    console.log('-'.repeat(60));
    console.log(result.budgetSummary);
    
    console.log('\n' + '-'.repeat(60));
    console.log('⚖️  ANÁLISE DE CONTRASTE:');
    console.log('-'.repeat(60));
    console.log(result.contrastAnalysis);
    
    console.log('\n' + '█'.repeat(60));
    console.log(`SCORE DE CONSISTÊNCIA: ${result.consistencyScore}%`);
    console.log('█'.repeat(60));

    process.exit(0);
  } catch (error) {
    logError('❌ Falha crítica na execução da tríade:', error as Error);
    process.exit(1);
  }
}

runTriadTest();
