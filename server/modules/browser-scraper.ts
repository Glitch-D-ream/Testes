
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
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

      // Extrair texto dos parágrafos
      const content = await page.evaluate(() => {
        // Tentar encontrar o corpo do artigo
        const article = document.querySelector('article') || document.querySelector('main') || document.body;
        
        // Pegar todos os parágrafos que pareçam conteúdo real
        const ps = Array.from(article.querySelectorAll('p, div.content-text__container, .texto-materia, .c-content-text'));
        
        const text = ps
          .map(p => (p as HTMLElement).innerText.trim())
          .filter(t => t.length > 50) // Filtro mais rigoroso para evitar menus/rodapés
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
