
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

export class BrowserScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
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

    // 1. Tentar extração estática (Axios)
    const staticContent = await this.scrapeStatic(targetUrl);
    const isBlocked = staticContent?.includes('Access Denied') || staticContent?.includes('403 Forbidden') || (staticContent && staticContent.length < 600);
    
    if (staticContent && staticContent.length > 1000 && !isBlocked) {
      logInfo(`[BrowserScraper] Extração estática bem-sucedida.`);
      return staticContent;
    }

    // 2. Tentar Playwright com estratégia de evasão
    if (playwrightAvailable && chromium) {
      logWarn(`[BrowserScraper] Tentando Playwright para superar bloqueio de rede...`);
      const dynamicContent = await this.scrapeDynamic(targetUrl);
      if (dynamicContent) return dynamicContent;
    }

    return staticContent || null;
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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      if (response.status === 403) return "Access Denied (403)";
      
      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, header').remove();
      const content = $('article, main, .content').text().trim() || $('body').text().trim();
      return content.substring(0, 10000);
    } catch { return null; }
  }

  private async scrapeDynamic(url: string): Promise<string | null> {
    if (!playwrightAvailable) return null;
    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true, 
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ] 
      });
      const context = await browser.newContext({ 
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1280, height: 1000 },
        extraHTTPHeaders: {
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      
      const page = await context.newPage();
      
      // Injetar script para esconder automação
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      logInfo(`[BrowserScraper] Navegando via Playwright (Evasão) para: ${url.substring(0, 60)}...`);
      
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      
      if (response && response.status() === 403) {
        logWarn(`[BrowserScraper] Recebido 403 via Playwright. Tentando scroll...`);
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(2000);
      }

      // Esperar por seletores de conteúdo real
      await page.waitForSelector('article, main, .content, .texto-materia, body', { timeout: 10000 }).catch(() => {});

      const content = await page.evaluate(() => {
        const toRemove = ['script', 'style', 'nav', 'footer', 'header', 'aside', '.ads', '.comments', '.paywall'];
        toRemove.forEach(s => document.querySelectorAll(s).forEach(el => el.remove()));
        
        const main = document.querySelector('article') || document.querySelector('main') || document.querySelector('.content') || document.body;
        return (main as HTMLElement).innerText;
      });

      await browser.close();
      
      if (content && content.length > 300 && !content.includes('Access Denied')) {
        return this.clean(content.substring(0, 15000));
      }
      
      return content; // Retornar mesmo se for erro para debug
    } catch (e: any) {
      if (browser) await browser.close();
      return null;
    }
  }

  private clean(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  }
}

export const browserScraper = new BrowserScraper();
