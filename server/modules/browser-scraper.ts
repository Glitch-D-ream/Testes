import { logInfo, logError, logWarn } from '../core/logger.ts';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Importação dinâmica do Playwright para evitar erro se não estiver instalado
let chromium: any = null;
let playwrightAvailable = false;

// Tentar carregar Playwright de forma assíncrona
(async () => {
  try {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
    playwrightAvailable = true;
    logInfo('[BrowserScraper] Playwright disponível para extração dinâmica');
  } catch (e) {
    logWarn('[BrowserScraper] Playwright não disponível. Usando apenas extração estática.');
    playwrightAvailable = false;
  }
})();

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
    logInfo(`[BrowserScraper] Iniciando extração: ${url}`);
    
    let targetUrl = url;
    if (url.includes('news.google.com/rss/articles')) {
      targetUrl = await this.resolveGoogleNewsLink(url);
    }

    // 1. Tentar extração estática (sempre funciona)
    const staticContent = await this.scrapeStatic(targetUrl);
    if (staticContent && staticContent.length > 500) {
      logInfo(`[BrowserScraper] Extração estática bem-sucedida: ${staticContent.length} caracteres`);
      return staticContent;
    }

    // 2. Se Playwright disponível e conteúdo estático insuficiente, tentar dinâmico
    if (playwrightAvailable && chromium) {
      logWarn(`[BrowserScraper] Extração estática insuficiente. Tentando Playwright...`);
      const dynamicContent = await this.scrapeDynamic(targetUrl);
      if (dynamicContent) {
        return dynamicContent;
      }
    }

    // 3. Se tudo falhar, retornar o conteúdo estático mesmo que curto
    if (staticContent && staticContent.length > 100) {
      logWarn(`[BrowserScraper] Retornando conteúdo estático parcial: ${staticContent.length} caracteres`);
      return staticContent;
    }

    logError(`[BrowserScraper] Falha total na extração de: ${url}`);
    return null;
  }

  private async resolveGoogleNewsLink(url: string): Promise<string> {
    try {
      logInfo(`[BrowserScraper] Resolvendo link do Google News...`);
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.getRandomUserAgent() },
        timeout: 8000,
        maxRedirects: 10,
        validateStatus: () => true
      });
      
      // Verificar se foi redirecionado para a URL real
      if (response.request?.res?.responseUrl) {
        const finalUrl = response.request.res.responseUrl;
        if (!finalUrl.includes('google.com') && !finalUrl.includes('consent.google')) {
          logInfo(`[BrowserScraper] URL resolvida via redirect: ${finalUrl.substring(0, 60)}...`);
          return finalUrl;
        }
      }
      
      const $ = cheerio.load(response.data);
      
      // Tentar meta refresh
      const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
      if (metaRefresh && metaRefresh.includes('url=')) {
        let nextUrl = metaRefresh.split('url=')[1];
        if (nextUrl.startsWith("'") || nextUrl.startsWith('"')) {
          nextUrl = nextUrl.substring(1, nextUrl.length - 1);
        }
        if (!nextUrl.includes('google.com')) {
          return nextUrl;
        }
      }

      // Tentar extrair do JavaScript
      const scriptContent = $('script').text();
      const urlMatch = scriptContent.match(/window\.location\.replace\("([^"]+)"\)/) || 
                       scriptContent.match(/window\.location\.href\s*=\s*"([^"]+)"/) ||
                       scriptContent.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (urlMatch && urlMatch[1] && !urlMatch[1].includes('google.com')) {
        return urlMatch[1];
      }

      // Tentar encontrar link externo no HTML
      const links = $('a[href^="http"]').map((i, el) => $(el).attr('href')).get();
      const externalLink = links.find(l => l && !l.includes('google.com') && !l.includes('consent'));
      if (externalLink) {
        return externalLink;
      }

      return url;
    } catch (e) {
      logWarn(`[BrowserScraper] Falha ao resolver Google News URL: ${url.substring(0, 50)}...`);
      return url;
    }
  }

  private async scrapeStatic(url: string): Promise<string | null> {
    try {
      logInfo(`[BrowserScraper] Extraindo conteúdo estático de: ${url.substring(0, 60)}...`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      
      // Extrair título
      const title = $('title').text().trim() || $('h1').first().text().trim();
      
      // Limpeza agressiva
      $('script, style, nav, footer, header, aside, .ads, .ad, .advertisement, .comments, .cookie-banner, .paywall, iframe, noscript, .social-share, .related-posts, .sidebar, [role="navigation"], [role="banner"], [role="complementary"]').remove();

      // Estratégia 1: Seletores semânticos específicos para sites brasileiros
      const selectors = [
        'article', 'main', '.content', '.post-content', '.entry-content', 
        '.materia-conteudo', '.texto-noticia', '.article-body', '.story-body',
        '.c-news__body', '.c-article__content', '.texto-materia', '.c-content-text',
        '.noticia-texto', '.post-body', '.article__content', '.article-text',
        '[itemprop="articleBody"]', '.single-post-content', '.news-content'
      ];

      for (const s of selectors) {
        const el = $(s);
        if (el.length) {
          const text = el.find('p, h1, h2, h3, li').map((i, p) => $(p).text().trim()).get().join('\n\n');
          if (text.length > 300) {
            return this.clean(title ? `${title}\n\n${text}` : text);
          }
        }
      }

      // Estratégia 2: Busca por densidade de parágrafos
      const allParagraphs = $('p').map((i, p) => $(p).text().trim()).get();
      const longParagraphs = allParagraphs.filter(p => p.length > 50);
      const longContent = longParagraphs.join('\n\n');
      
      if (longContent.length > 200) {
        return this.clean(title ? `${title}\n\n${longContent}` : longContent);
      }

      // Estratégia 3: Extrair todo o texto do body
      const bodyText = $('body').text().trim();
      if (bodyText.length > 200) {
        return this.clean(title ? `${title}\n\n${bodyText.substring(0, 5000)}` : bodyText.substring(0, 5000));
      }

      return null;
    } catch (e: any) {
      logWarn(`[BrowserScraper] Falha na extração estática de ${url.substring(0, 50)}...: ${e.message}`);
      return null;
    }
  }

  private async scrapeDynamic(url: string): Promise<string | null> {
    if (!playwrightAvailable || !chromium) {
      logWarn('[BrowserScraper] Playwright não disponível para extração dinâmica');
      return null;
    }

    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      const context = await browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1280, height: 800 }
      });
      const page = await context.newPage();
      
      logInfo(`[BrowserScraper] Navegando via Playwright para: ${url.substring(0, 60)}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      
      // Esperar um pouco para carregar conteúdo JS
      await page.waitForTimeout(2000);

      // Extrair texto usando script no browser
      const content = await page.evaluate(() => {
        // Remover elementos indesejados
        const toRemove = ['script', 'style', 'nav', 'footer', 'header', 'aside', '.ads', '.comments', '.cookie-banner', '.paywall'];
        toRemove.forEach(s => {
          document.querySelectorAll(s).forEach(el => el.remove());
        });

        // Tentar pegar o conteúdo principal
        const mainSelectors = ['article', 'main', '.content', '.post-content', '.entry-content', '[itemprop="articleBody"]'];
        for (const s of mainSelectors) {
          const el = document.querySelector(s);
          if (el && (el as HTMLElement).innerText.length > 300) {
            return (el as HTMLElement).innerText;
          }
        }

        return document.body.innerText;
      });

      await browser.close();
      
      if (content && content.length > 200) {
        return this.clean(content.substring(0, 12000));
      }
      
      return null;
    } catch (e: any) {
      logError(`[BrowserScraper] Falha na extração dinâmica de ${url.substring(0, 50)}...: ${e.message}`);
      if (browser) await browser.close();
      return null;
    }
  }

  private clean(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const browserScraper = new BrowserScraper();
