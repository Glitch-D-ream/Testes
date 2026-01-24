
import { scoutAgent } from './server/agents/scout.js';
import { logInfo } from './server/core/logger.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testScout() {
  console.log('🚀 Testando ScoutAgent Melhorado (RSS + Persistência)...\n');

  const query = 'Lula'; // Político com muitas notícias para garantir resultados no RSS
  
  try {
    console.log(`🔍 Buscando informações sobre: ${query}...`);
    const results = await scoutAgent.search(query);
    
    console.log(`\n✅ Varredura concluída!`);
    console.log(`📦 Novas fontes encontradas: ${results.length}`);

    results.forEach((source, index) => {
      console.log(`\n--- Fonte #${index + 1} ---`);
      console.log(`📌 Título: ${source.title}`);
      console.log(`🔗 URL: ${source.url}`);
      console.log(`🏢 Origem: ${source.source}`);
      console.log(`📅 Data: ${source.publishedAt}`);
    });

    if (results.length > 0) {
      console.log('\n🔄 Testando Persistência (Segunda busca não deve retornar os mesmos itens)...');
      const secondResults = await scoutAgent.search(query);
      console.log(`📦 Itens na segunda busca: ${secondResults.length} (Esperado: 0 ou menos que a primeira)`);
    }

  } catch (error) {
    console.error('💥 Erro no teste do Scout:', error);
  }
}

testScout();
