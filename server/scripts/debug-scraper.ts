
import { contentScraper } from '../modules/content-scraper.ts';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugScraper() {
  const testUrl = 'https://news.google.com/rss/articles/CBMi4AFBVV95cUxQWnN6WENFalJpVFlueloxa204TWlTcUdid2p3cTdNb2hqSzNlZkNpZUpUbzBKLWVKQy14X0RROHUtWFFJNXgzWEVzbnNyOGhHS2RkY2U2dU9pdUFOUGt6bGFkNnF1c0hLSDRTVFY1eFlmalNIOGlISzlfTGNyV1NtUTA0VTBXRW01T0x1NnN0eGtEQ2xmajRkQjNyVjNpNHR6UEMwSlJEVUJBaDRiMjUtQW8xbm41Mm0zZ1E2ZmRrLTR0ci11XzgwcjU2YjdobC1OMU5TTHNueHEzZEQ5eEZlOdIB5gFBVV95cUxPY3NYbVpWV0dBSzJwaHpiazRrSFdKUDVSd0phLXByOTNpWkZwUjhfaTBJVEpQZG50WS1YVS1Dbi16TE5Eb1p6SXBmaXRJMDk4ODdua3FXc3ZKbWUtTV9oZVZsdG9Ub0tmS3Y5Q1BYVkNxakZ4X2JIa21OVjBFMjFJT0lBa1M1OWZ1RlNSb20zSDlyN2tZeWRuYXk3Z3E3ZVQ4Ynl6LTJDdUhma1JSQjZJYWFmRHNEUkpMRWpQM1hzTDdaOHVraTBEUmpLRHFpTU5DZGdPRzZ4NnFyVHBYeWZCNVB5SUQtUQ?oc=5';

  console.log(`\n🔍 DEBUG SCRAPER: ${testUrl}\n`);

  try {
    console.log(`1. Tentando resolver URL real...`);
    const res = await axios.get(testUrl, { maxRedirects: 10, timeout: 10000 });
    const finalUrl = res.request.res.responseUrl || testUrl;
    console.log(`   URL Final Axios: ${finalUrl}`);

    const $ = cheerio.load(res.data);
    const redirectLink = $('a[jslog]').attr('href') || $('a').first().attr('href');
    console.log(`   Link detectado no HTML: ${redirectLink}`);

    console.log(`\n2. Executando Scrape completo...`);
    const content = await contentScraper.scrape(testUrl);
    
    if (content) {
      console.log(`\n✅ SUCESSO! Conteúdo extraído (${content.length} caracteres):`);
      console.log(`---------------------------------------------------------`);
      console.log(content.substring(0, 500) + '...');
      console.log(`---------------------------------------------------------`);
    } else {
      console.log(`\n❌ FALHA: Nenhum conteúdo extraído.`);
    }
  } catch (e: any) {
    console.error(`\n❌ ERRO: ${e.message}`);
  }
}

debugScraper();
