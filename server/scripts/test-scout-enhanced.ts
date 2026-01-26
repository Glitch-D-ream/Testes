
import { scoutAgent } from '../agents/scout.ts';
import { filterAgent } from '../agents/filter.ts';
import { logInfo } from '../core/logger.ts';

async function testEnhancedScout() {
  const politicianName = 'Luiz Inácio Lula da Silva';
  console.log(`\n🚀 Testando Scout e Filter Aprimorados para: ${politicianName}\n`);

  // 1. Testar Busca Híbrida (Deep Search)
  logInfo(`[Test] Iniciando busca profunda...`);
  const rawSources = await scoutAgent.search(politicianName, true);
  console.log(`✅ Scout encontrou ${rawSources.length} fontes brutas.`);

  // Mostrar algumas fontes para conferência
  rawSources.slice(0, 5).forEach((s, i) => {
    console.log(`   [${i+1}] ${s.title} (${s.source})`);
    console.log(`       └─ Tamanho do Conteúdo: ${s.content.length} caracteres`);
    if (s.content.length < 200) {
      console.log(`       ⚠️ ALERTA: Conteúdo muito curto! Possível falha na extração completa.`);
    }
  });

  // 2. Testar Filtragem Aprimorada
  logInfo(`[Test] Iniciando filtragem...`);
  const filteredSources = await filterAgent.filter(rawSources, false);
  console.log(`✅ Filter selecionou ${filteredSources.length} fontes relevantes.`);

  // 3. Verificar se há notícias de portais de elite e potenciais entrevistas/processos
  const eliteSources = filteredSources.filter(s => 
    ['G1', 'Folha', 'Estadão', 'CNN Brasil', 'Poder360'].some(d => s.source.includes(d))
  );
  
  const interviewSources = filteredSources.filter(s => 
    s.content.toLowerCase().includes('entrevista') || (s.content.match(/"|“|”/g) || []).length > 5
  );

  const legalSources = filteredSources.filter(s => 
    s.content.toLowerCase().includes('processo') || s.url.includes('jusbrasil.com.br')
  );

  console.log(`\n📊 Resumo da Qualidade:`);
  console.log(`   - Fontes de Elite: ${eliteSources.length}`);
  console.log(`   - Entrevistas Detectadas: ${interviewSources.length}`);
  console.log(`   - Fontes Jurídicas Detectadas: ${legalSources.length}`);

  if (filteredSources.length > 0) {
    logInfo(`\n🎉 Teste concluído com sucesso! O sistema agora captura e filtra dados de forma muito mais abrangente.`);
  } else {
    console.warn(`\n⚠️ Teste concluído, mas nenhuma fonte foi selecionada pelo filtro.`);
  }
}

testEnhancedScout().catch(console.error);
