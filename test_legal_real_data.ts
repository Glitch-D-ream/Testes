
import { jusBrasilAlternative } from './server/integrations/jusbrasil-alternative.ts';
import { initializeDatabase } from './server/core/database.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('⚖️ TESTE DE COLETA JURÍDICA REAL: ERIKA HILTON');
  console.log('==============================================');
  
  try {
    await initializeDatabase();
    const name = 'Erika Hilton';
    
    console.log('\n1️⃣ Buscando Registros Jurídicos Reais (Jusbrasil/Escavador/STF)...');
    const records = await jusBrasilAlternative.searchLegalRecords(name);
    console.log(`Registros encontrados: ${records.length}`);
    records.forEach((r, i) => {
      console.log(`[${i+1}] ${r.title}`);
      console.log(`    URL: ${r.url}`);
      console.log(`    Fonte: ${r.source}`);
      console.log(`    Trecho: ${r.excerpt.substring(0, 150)}...`);
    });

    console.log('\n2️⃣ Buscando Diários Oficiais Reais (Querido Diário)...');
    const gazettes = await jusBrasilAlternative.searchQueridoDiario(name);
    console.log(`Diários encontrados: ${gazettes.length}`);
    gazettes.forEach((g, i) => {
      console.log(`[${i+1}] ${g.title}`);
      console.log(`    Data: ${g.date}`);
      console.log(`    URL: ${g.url}`);
      console.log(`    Trecho: ${g.excerpt.substring(0, 150)}...`);
    });

  } catch (error) {
    console.error('Erro no teste jurídico real:', error);
  }
}

test();
