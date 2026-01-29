
import { jusBrasilAlternative } from './server/integrations/jusbrasil-alternative.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('🤖 TESTE DE EXTRAÇÃO VIA SNIPPETS REAIS (SETH VII)');
  console.log('===============================================');

  const politician = 'Erika Hilton';
  
  try {
    console.log(`\n🔎 Buscando Diários Oficiais para: ${politician}`);
    const gazettes = await jusBrasilAlternative.searchQueridoDiario(politician);
    
    console.log(`\n✅ Encontrados ${gazettes.length} registros com conteúdo real extraído.`);
    
    gazettes.forEach((g, i) => {
      console.log(`\n--- REGISTRO #${i + 1} ---`);
      console.log(`📌 TÍTULO: ${g.title}`);
      console.log(`🔗 LINK: ${g.url}`);
      console.log(`📝 CONTEÚDO REAL EXTRAÍDO:\n${g.content}`);
      console.log('---------------------------');
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

test();
