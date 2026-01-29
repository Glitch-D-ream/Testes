
import { browserScraper } from './server/modules/browser-scraper.ts';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log('🤖 TESTE DE EXTRAÇÃO AUTÔNOMA (SETH VII)');
  console.log('=======================================');

  const urls = [
    "https://noticias.uol.com.br/politica/ultimas-noticias/2023/11/21/lula-condecora-mano-brown-erika-hilton-medalha-ordem-do-merito-cultural.htm",
    "https://www.poder360.com.br/poder-governo/de-milton-nascimento-a-erika-hilton-leia-os-condecorados-por-lula/"
  ];

  for (const url of urls) {
    console.log(`\n🌐 Tentando extrair conteúdo de: ${url}`);
    try {
      const content = await browserScraper.scrape(url);
      if (content && content.length > 500 && !content.includes('Access Denied')) {
        console.log('✅ SUCESSO! Conteúdo extraído com autonomia.');
        console.log('📝 PREVIEW DO CONTEÚDO:');
        console.log(content.substring(0, 800) + '...');
      } else {
        console.log('❌ FALHA: Conteúdo bloqueado ou insuficiente.');
        if (content) console.log('Snippet do erro:', content.substring(0, 200));
      }
    } catch (error) {
      console.error('❌ Erro fatal no teste:', error);
    }
    console.log('---------------------------------------');
  }
}

test();
