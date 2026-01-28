
import { logInfo, logError, logWarn } from '../core/logger.ts';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

export class BrowserScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async scrape(url: string): Promise<string | null> {
    logInfo(`[BrowserScraper] Iniciando extração híbrida (Estático + Dinâmico): ${url}`);
    
    let targetUrl = url;
    if (url.includes('news.google.com/rss/articles')) {
      targetUrl = await this.resolveGoogleNewsLink(url);
    }

    // 1. Tentar extração estática (mais rápida e barata)
    const staticContent = await this.scrapeStatic(targetUrl);
    if (staticContent && staticContent.length > 800) {
      return staticContent;
    }

    // 2. Se falhar ou conteúdo for curto, tentar extração dinâmica com Playwright
    logWarn(`[BrowserScraper] Extração estática insuficiente para ${targetUrl}. Ativando Playwright...`);
    return await this.scrapeDynamic(targetUrl);
  }

  private async resolveGoogleNewsLink(url: string): Promise<string> {
    try {
      logInfo(`[BrowserScraper] Resolvendo link do Google News...`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.getRandomUserAgent() },
        timeout: 5000,
        maxRedirects: 5
      });
      
      const $ = cheerio.load(response.data);
      
      const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
      if (metaRefresh && metaRefresh.includes('url=')) {
        let nextUrl = metaRefresh.split('url=')[1];
        if (nextUrl.startsWith("'") || nextUrl.startsWith('"')) nextUrl = nextUrl.substring(1, nextUrl.length - 1);
        return nextUrl;
      }

      const scriptContent = $('script').text();
      const urlMatch = scriptContent.match(/window\.location\.replace\("([^"]+)"\)/) || 
                       scriptContent.match(/window\.location\.href\s*=\s*"([^"]+)"/);
      if (urlMatch && urlMatch[1]) return urlMatch[1];

      return url;
    } catch (e) {
      return url;
    }
  }

  private async scrapeStatic(url: string): Promise<string | null> {
    try {
      logInfo(`[BrowserScraper] Extraindo conteúdo estático de: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 10000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Limpeza
      $('script, style, nav, footer, header, aside, .ads, .comments, .cookie-banner, .paywall, iframe, noscript').remove();

      // Estratégia 1: Seletores Semânticos
      const selectors = [
        'article', 'main', '.content', '.post-content', '.entry-content', 
        '.materia-conteudo', '.texto-noticia', '.article-body', '.story-body',
        '.c-news__body', '.c-article__content', '.texto-materia', '.c-content-text'
      ];

      for (const s of selectors) {
        const el = $(s);
        if (el.length) {
          const text = el.find('p, h1, h2, h3').map((i, p) => $(p).text().trim()).get().join('\n\n');
          if (text.length > 400) return this.clean(text);
        }
      }

      // Estratégia 2: Busca por densidade de parágrafos
      const allParagraphs = $('p').map((i, p) => $(p).text().trim()).get();
      const longContent = allParagraphs.filter(p => p.length > 40).join('\n\n');
      
      if (longContent.length > 300) return this.clean(longContent);

      return null;
    } catch (e: any) {
      logWarn(`[BrowserScraper] Falha na extração estática de ${url}: ${e.message}`);
      return null;
    }
  }

  private async scrapeDynamic(url: string): Promise<string | null> {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();
      
      logInfo(`[BrowserScraper] Navegando via Playwright para: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Esperar um pouco para carregar conteúdo JS
      await page.waitForTimeout(2000);

      // Extrair texto usando script no browser para ser mais eficiente
      const content = await page.evaluate(() => {
        // Remover elementos indesejados
        const toRemove = ['script', 'style', 'nav', 'footer', 'header', 'aside', '.ads', '.comments', '.cookie-banner'];
        toRemove.forEach(s => {
          document.querySelectorAll(s).forEach(el => el.remove());
        });

        // Tentar pegar o conteúdo principal
        const mainSelectors = ['article', 'main', '.content', '.post-content', '.entry-content'];
        for (const s of mainSelectors) {
          const el = document.querySelector(s);
          if (el) return el.innerText;
        }

        return document.body.innerText;
      });

      await browser.close();
      
      if (content && content.length > 300) {
        return this.clean(content.substring(0, 15000));
      }
      
      return null;
    } catch (e: any) {
      logError(`[BrowserScraper] Falha na extração dinâmica de ${url}: ${e.message}`);
      if (browser) await browser.close();
      return null;
    }
  }

  private clean(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n\n')
      .trim();
  }
}

export const browserScraper = new BrowserScraper();
