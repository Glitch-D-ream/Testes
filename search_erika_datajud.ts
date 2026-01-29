
import axios from 'axios';

async function searchPolitician() {
  console.log('⚖️ BUSCA REAL DATAJUD - ERIKA HILTON');
  console.log('===================================');

  const apiKey = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
  // Testar em tribunais onde ela provavelmente tem atuação (TJSP, TRF3, STF)
  const tribunals = ['tjsp', 'trf3', 'stf']; 
  
  for (const tribunal of tribunals) {
    console.log(`\n🔎 Pesquisando no ${tribunal.toUpperCase()}...`);
    const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;

    // Query para buscar por nome da parte
    const payload = {
      "query": {
        "bool": {
          "must": [
            { "match": { "partes.nome": "ERIKA SANTOS SILVA" } } // Nome civil ou variações
          ]
        }
      },
      "size": 5
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const hits = response.data.hits?.hits || [];
      console.log(`✅ Encontrados ${response.data.hits?.total?.value || 0} registros.`);

      hits.forEach((hit: any, i: number) => {
        const p = hit._source;
        console.log(`\n--- PROCESSO #${i + 1} ---`);
        console.log(`📌 NÚMERO: ${p.numeroProcesso}`);
        console.log(`📂 CLASSE: ${p.classe?.nome}`);
        console.log(`🏛 ÓRGÃO: ${p.orgaoJulgador?.nome}`);
        console.log(`📅 ÚLTIMA ATUALIZAÇÃO: ${p.dataHoraUltimaAtualizacao}`);
        if (p.movimentos) {
          console.log(`📝 ÚLTIMA MOVIMENTAÇÃO: ${p.movimentos[0]?.nome}`);
        }
      });
    } catch (error: any) {
      console.error(`❌ Erro no ${tribunal}:`, error.response?.status || error.message);
    }
  }
}

searchPolitician();
