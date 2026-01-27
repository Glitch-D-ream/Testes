
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { chromium } from 'playwright';

export class BrowserScraper {
  /**
   * Extrai o conteúdo completo de uma URL usando um navegador real.
   * Isso resolve automaticamente redirecionamentos do Google News e lida com sites complexos.
   */
  async scrape(url: string): Promise<string | null> {
    logInfo(`[BrowserScraper] Iniciando extração via browser: ${url}`);
    
    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--window-size=1920,1080'
        ]
      });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo'
      });
      
      // Injetar script para esconder o uso de automação
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });
      const page = await context.newPage();
      
      // Definir timeout de 20 segundos e esperar apenas o DOM carregar
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      
      // Aguardar até que a URL não seja mais do Google News ou timeout
      let retries = 0;
      while (page.url().includes('news.google.com') && retries < 5) {
        await page.waitForTimeout(1000);
        retries++;
      }
      
      // Esperar a página carregar completamente após o redirecionamento
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      
      const finalUrl = page.url();
      logInfo(`[BrowserScraper] URL final resolvida: ${finalUrl}`);

      // Remover elementos de ruído
      await page.evaluate(() => {
        const selectors = 'script, style, nav, footer, header, aside, iframe, noscript, .ads, .advertisement, .social-share, .comments';
        document.querySelectorAll(selectors).forEach(el => el.remove());
      });

      // Extrair texto dos parágrafos com seletores mais abrangentes
      const content = await page.evaluate(() => {
        const selectors = [
          'article', 'main', '.content-text__container', '.c-news__body', 
          '.c-article__content', '.texto-materia', '.c-content-text', 
          '.article-content', '.content-body', '.article-body', 
          '.post-content', '.entry-content', '.main-content', 
          '.texto-noticia', '.materia-conteudo', '.entry-content-body', 
          '.news-content', '.article__content', '.story-content', 
          '.node-article', '.text-content', '.body-text'
        ];
        
        let root: Element | null = null;
        for (const s of selectors) {
          const el = document.querySelector(s);
          if (el && el.innerText.length > 500) {
            root = el;
            break;
          }
        }
        
        if (!root) root = document.body;
        
        // Pegar parágrafos e elementos de texto
        const elements = Array.from(root.querySelectorAll('p, h1, h2, h3, li, div[class*="text"], div[class*="content"]'));
        
        const text = elements
          .map(el => (el as HTMLElement).innerText.trim())
          .filter(t => t.length > 40 && !t.includes('©') && !t.includes('Copyright'))
          .filter((t, i, arr) => arr.indexOf(t) === i) // Remover duplicatas
          .join('\n\n');
          
        return text;
      });

      const cleanContent = content.trim();
      
      if (cleanContent.length < 200) {
        logWarn(`[BrowserScraper] Conteúdo extraído ainda parece curto (${cleanContent.length} chars)`);
      } else {
        logInfo(`[BrowserScraper] Sucesso: ${cleanContent.length} caracteres extraídos.`);
      }

      return cleanContent || null;
    } catch (error: any) {
      logError(`[BrowserScraper] Falha na extração: ${error.message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }
}

export const browserScraper = new BrowserScraper();
