import { brainAgent } from '../server/agents/brain.ts';
import { initializeDatabase } from '../server/core/database.ts';
import { logInfo, logError } from '../server/core/logger.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function testEvolution() {
  logInfo('🚀 Iniciando Teste de Evolução de Inteligência: Seth VII');
  
  try {
    // 1. Inicializar Banco
    await initializeDatabase();

    // 2. Executar Brain Agent para um político conhecido
    const politician = "Jones Manoel";
    
    // Limpar cache para forçar busca profunda
    const { getSupabase } = await import('../server/core/database.ts');
    const supabase = getSupabase();
    
    logInfo(`🧹 Limpando cache L3 para forçar busca profunda de ${politician}...`);
    await supabase.from('data_snapshots').delete().ilike('data_source', `%${politician}%`);
    await supabase.from('scout_history').delete().ilike('politician_name', `%${politician}%`);
    
    logInfo(`🧠 Ativando Brain Agent com novos módulos para: ${politician}`);
    
    const start = Date.now();
    const result = await brainAgent.analyze(politician);
    const end = Date.now();
    
    logInfo(`✅ Análise concluída em ${((end - start) / 1000).toFixed(2)}s.`);
    
    // 3. Validar Módulo de Vulnerabilidade
    console.log('\n' + '█'.repeat(60));
    console.log('🛡️  MÓDULO DE VULNERABILIDADE ESTRATÉGICA');
    console.log('█'.repeat(60));
    
    if (result.vulnerabilityReport) {
      const vr = result.vulnerabilityReport;
      console.log(`\n🚩 RADICALISM GAP: ${vr.radicalismGap.score}/100`);
      console.log(`📝 DESCRIÇÃO: ${vr.radicalismGap.description}`);
      console.log(`📜 CITAÇÕES: ${vr.radicalismGap.evidenceCitations.join(' | ')}`);
      
      console.log(`\n🧠 COMPLEXITY PENALTY: ${vr.complexityPenalty.score}/100`);
      console.log(`📝 DESCRIÇÃO: ${vr.complexityPenalty.description}`);
      console.log(`🧩 TERMOS TÉCNICOS: ${vr.complexityPenalty.technicalTerms.join(', ')}`);
      
      console.log(`\n⚖️  CONTRADIÇÕES DETECTADAS:`);
      vr.contradictions.forEach((c: any) => console.log(` - [${c.point}] A: ${c.evidenceA} VS B: ${c.evidenceB}`));

      console.log(`\n⚔️  VETORES DE ATAQUE (COM ALAVANCA):`);
      vr.attackVectors.forEach((v: any) => console.log(` - ${v.title}: ${v.description} [ALAVANCA: ${v.leverage}]`));
      
      console.log(`\n🛡️  ESTRATÉGIAS DE DEFESA:`);
      vr.defenseStrategies.forEach((s: string) => console.log(` - ${s}`));
    } else {
      console.log('❌ Erro: Relatório de vulnerabilidade não gerado.');
    }

    console.log('\n' + '█'.repeat(60));
    console.log('🔍 EVIDÊNCIAS BRUTAS MINERADAS');
    console.log('█'.repeat(60));
    if (result.evidences) {
      result.evidences.slice(0, 5).forEach((e: any) => {
        console.log(`\n📌 [${e.category}] ${e.statement}`);
        console.log(`🔗 Fonte: ${e.sourceTitle} (${e.sourceUrl})`);
      });
    }

    // 4. Validar Módulo de Benchmarking
    console.log('\n' + '█'.repeat(60));
    console.log('📊 MÓDULO DE BENCHMARKING POLÍTICO');
    console.log('█'.repeat(60));
    
    if (result.benchmarkResult) {
      const br = result.benchmarkResult;
      console.log(`\n👥 GRUPO DE COMPARAÇÃO: ${br.comparisonGroup}`);
      console.log(`✨ UNICIDADE: ${br.uniqueness}`);
      console.log(`🏆 RANKING NO GRUPO: ${br.rankingInGroup}/${br.totalInGroup}`);
      
      console.log(`\n📈 MÉTRICAS VS MÉDIA DO GRUPO:`);
      console.log(` - Alinhamento Orçamentário: ${br.metrics.budgetAlignment} (Média: ${br.groupAverages.budgetAlignment})`);
      console.log(` - Fidelidade Partidária: ${br.metrics.partyLoyalty} (Média: ${br.groupAverages.partyLoyalty})`);
    } else {
      console.log('❌ Erro: Resultado de benchmarking não gerado.');
    }

    process.exit(0);
  } catch (error) {
    logError('❌ Falha crítica no teste de evolução:', error as Error);
    process.exit(1);
  }
}

testEvolution();
