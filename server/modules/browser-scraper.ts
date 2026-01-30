
import { logInfo, logError, logWarn } from '../core/logger.ts';
import axios from 'axios';
import * as cheerio from 'cheerio';

let chromium: any = null;
let playwrightAvailable = false;

(async () => {
  try {
    const playwright = await import('playwright');
    chromium = playwright.chromium;
    playwrightAvailable = true;
    logInfo('[BrowserScraper] Playwright disponível para extração dinâmica');
  } catch (e) {
    logWarn('[BrowserScraper] Playwright não disponível.');
    playwrightAvailable = false;
  }
})();

/**
 * BrowserScraper v3.1 - RESOURCE PROTECTED
 * Implementa semáforo de concorrência para evitar estouro de RAM no Railway.
 */
export class BrowserScraper {
  private activeBrowsers = 0;
  // Limite ultra-rigoroso para Railway Free Tier (512MB RAM)
  private readonly MAX_CONCURRENT_BROWSERS = process.env.NODE_ENV === 'production' ? 1 : 2; 
  private readonly GLOBAL_TIMEOUT = 45000; // 45 segundos de timeout global
  private queue: Array<() => void> = [];

  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async scrape(url: string): Promise<string | null> {
    logInfo(`[BrowserScraper] Iniciando extração: ${url.substring(0, 60)}...`);
    
    let targetUrl = url;
    if (url.includes('news.google.com/rss/articles')) {
      targetUrl = await this.resolveGoogleNewsLink(url);
    }

    // 1. Tentar extração estática (Axios) - Já otimizado no IngestionService, mas mantemos aqui como redundância
    const staticContent = await this.scrapeStatic(targetUrl);
    const isBlocked = staticContent?.includes('Access Denied') || staticContent?.includes('403 Forbidden') || (staticContent && staticContent.length < 600);
    
    if (staticContent && staticContent.length > 1000 && !isBlocked) {
      logInfo(`[BrowserScraper] Extração estática bem-sucedida.`);
      return staticContent;
    }

    // 2. Tentar Playwright com controle de concorrência
    if (playwrightAvailable && chromium) {
      return await this.enqueueDynamicScrape(targetUrl);
    }

    return staticContent || null;
  }

  private async enqueueDynamicScrape(url: string): Promise<string | null> {
    if (this.activeBrowsers >= this.MAX_CONCURRENT_BROWSERS) {
      logWarn(`[BrowserScraper] Limite de concorrência atingido (${this.activeBrowsers}). Aguardando vaga...`);
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.activeBrowsers++;
    try {
      return await this.scrapeDynamic(url);
    } finally {
      this.activeBrowsers--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }

  private async resolveGoogleNewsLink(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.getRandomUserAgent() },
        timeout: 5000,
        maxRedirects: 10
      });
      return response.request?.res?.responseUrl || url;
    } catch { return url; }
  }

  private async scrapeStatic(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      if (response.status === 403) return "Access Denied (403)";
      
      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, header, iframe').remove();
      const content = $('article, main, .content, .texto-materia').text().trim() || $('body').text().trim();
      return content.substring(0, 10000);
    } catch { return null; }
  }

  private async scrapeDynamic(url: string): Promise<string | null> {
    if (!playwrightAvailable) return null;
    let browser;
    try {
      logInfo(`[BrowserScraper] Lançando Chromium (Ativos: ${this.activeBrowsers})...`);
      browser = await chromium.launch({ 
        headless: true, 
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--js-flags="--max-old-space-size=128"' // Limitar memória do motor JS do Chromium
        ] 
      });
      
      const context = await browser.newContext({ 
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1280, height: 720 }
      });
      
      const page = await context.newPage();
      
      // Bloquear recursos pesados para economizar banda e RAM (Mantendo CSS para renderização correta)
      await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,mp4,webm,woff,woff2,ttf,otf}', route => route.abort());

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.GLOBAL_TIMEOUT });
      
      // Esperar um pouco para SPAs carregarem
      await page.waitForTimeout(5000);

      const content = await page.evaluate(() => {
        // 1. Remover elementos ruidosos conhecidos
        const toRemove = [
          'script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe', 'noscript',
          '.ads', '.sidebar', '.menu', '.nav', '.footer', '.header', '.comments', 
          '.related', '.social-share', '.newsletter', '.popup', '.modal', '.paywall'
        ];
        toRemove.forEach(s => document.querySelectorAll(s).forEach(el => el.remove()));

        // 2. Tentar encontrar o container principal de conteúdo
        const mainSelectors = [
          'article', 'main', '[role="main"]', 
          '.content', '.post-content', '.article-body', '#main-content', 
          '.texto-materia', // Geral BR
          '.content-text__container', // G1
          '.c-news__body', // Folha
          '.n--noticia__content', // Estadão
          '.article__content', // CNN Brasil
          '.entry-content' // Blogs WordPress
        ];
        for (const selector of mainSelectors) {
          const element = document.querySelector(selector) as HTMLElement;
          if (element && element.innerText.length > 500) {
            // Captura profunda: tentar parágrafos primeiro para manter estrutura
            const paragraphs = Array.from(element.querySelectorAll('p'))
              .map(p => p.innerText.trim())
              .filter(t => t.length > 20);
            
            // Se os parágrafos capturados forem significativos, usamos eles
            if (paragraphs.length > 3 && paragraphs.join('').length > 500) {
              return paragraphs.join('\n\n');
            }
            
            // Caso contrário, pegamos o innerText completo do elemento principal
            return element.innerText;
          }
        }

        // 3. Fallback para o body (tentar parágrafos primeiro)
        const bodyParagraphs = Array.from(document.querySelectorAll('p'))
          .map(p => p.innerText.trim())
          .filter(t => t.length > 30);
        
        if (bodyParagraphs.length > 5 && bodyParagraphs.join('').length > 1000) {
          return bodyParagraphs.join('\n\n');
        }

        // Fallback final: innerText do body completo
        return document.body.innerText;
      });

      await browser.close();
      return this.clean(content.substring(0, 15000));
    } catch (e: any) {
      logError(`[BrowserScraper] Erro no Playwright: ${e.message}`);
      if (browser) await browser.close();
      return null;
    }
  }

  private clean(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  }
}

export const browserScraper = new BrowserScraper();
