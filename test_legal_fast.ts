
import axios from 'axios';
import { directSearchImproved } from './server/modules/direct-search-improved.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function fastTest() {
  console.log('⚡ TESTE RÁPIDO DE COLETA JURÍDICA (V2)');
  const target = 'Erika Hilton';

  try {
    // 1. Testar API Querido Diário com User-Agent
    console.log('\n1️⃣ Testando API Querido Diário...');
    const qdUrl = `https://queridodiario.ok.org.br/api/gazettes?keyword=${encodeURIComponent(target)}`;
    const qdRes = await axios.get(qdUrl, { 
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });
    const count = qdRes.data?.gazettes?.length || 0;
    console.log(`✅ Querido Diário retornou ${count} registros.`);
    if (count > 0) {
      console.log(`   Exemplo: ${qdRes.data.gazettes[0].territory_name} - ${qdRes.data.gazettes[0].url}`);
    }

    // 2. Testar Busca Jusbrasil (Links)
    console.log('\n2️⃣ Testando Busca Pública (Links)...');
    const links = await directSearchImproved.search(`site:jusbrasil.com.br "${target}"`);
    console.log(`✅ Encontrados ${links.length} links no Jusbrasil.`);
    if (links.length > 0) {
      console.log(`   Exemplo: ${links[0].title} - ${links[0].url}`);
    }

  } catch (error: any) {
    console.error('❌ Erro no teste rápido:', error.message);
    if (error.response) console.log('Status:', error.response.status);
  }
}

fastTest();
