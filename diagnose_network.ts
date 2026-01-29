import axios from 'axios';

async function diagnose() {
  const targets = [
    { name: 'Câmara API', url: 'https://dadosabertos.camara.leg.br/api/v2/deputados?nome=Erika%20Hilton' },
    { name: 'Senado API', url: 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual' },
    { name: 'Google News RSS', url: 'https://news.google.com/rss/search?q=Erika%20Hilton' },
    { name: 'Bing Search', url: 'https://www.bing.com/search?q=Erika%20Hilton' },
    { name: 'Wikipedia API', url: 'https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=Erika%20Hilton&format=json' }
  ];

  console.log('--- DIAGNÓSTICO DE REDE ---');
  for (const target of targets) {
    try {
      const start = Date.now();
      const res = await axios.get(target.url, { 
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const duration = Date.now() - start;
      console.log(`✅ [${target.name}] OK (${duration}ms) - Status: ${res.status}`);
    } catch (err: any) {
      console.log(`❌ [${target.name}] FALHA: ${err.message}`);
    }
  }
}

diagnose();
