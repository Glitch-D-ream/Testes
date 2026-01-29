
import axios from 'axios';

async function testDatajud() {
  console.log('⚖️ TESTE API DATAJUD (SETH VII)');
  console.log('==============================');

  const apiKey = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
  const tribunal = 'tjsp'; // Exemplo: TJSP
  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;

  const payload = {
    "query": {
      "match": {
        "numeroProcesso": "1000000-00.2023.8.26.0000" // Exemplo genérico
      }
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ CONEXÃO ESTABELECIDA!');
    console.log('Status:', response.status);
    console.log('Resultados:', response.data.hits?.total?.value || 0);
  } catch (error: any) {
    console.error('❌ ERRO NA CONEXÃO:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    } else {
      console.error(error.message);
    }
  }
}

testDatajud();
