
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { chromium } from 'playwright';

export class BrowserScraper {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Extrai o conteúdo completo de uma URL usando um navegador real com blindagem anti-bloqueio.
   */
  async scrape(url: string): Promise<string | null> {
    logInfo(`[BrowserScraper] Iniciando extração via browser (blindado): ${url}`);
    
    // Delay inteligente aleatório (0.5s a 2s) para simular comportamento humano
    const delay = Math.floor(Math.random() * 1500) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    let browser;
    try {
      browser = await chromium.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-infobars',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      });

      const userAgent = this.getRandomUserAgent();
      const isMobile = userAgent.includes('Mobile');

      const context = await browser.newContext({
        userAgent: userAgent,
        viewport: isMobile ? { width: 390, height: 844 } : { width: 1920, height: 1080 },
        deviceScaleFactor: isMobile ? 3 : 1,
        hasTouch: isMobile,
        isMobile: isMobile,
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo'
      });
      
      // Injetar script avançado para esconder automação
      await context.addInitScript(() => {
        // Esconder webdriver
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        
        // Simular plugins e linguagens
        Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        
        // Simular Chrome Runtime se não estiver no Firefox
        if (!navigator.userAgent.includes('Firefox')) {
           (window as any).chrome = { runtime: {} };
        }

        // Simular permissões
        const originalQuery = window.navigator.permissions.query;
        (window.navigator.permissions as any).query = (parameters: any) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

      const page = await context.newPage();
      
      // Definir timeout de 25 segundos
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      
      // Lidar com redirecionamento do Google News
      let retries = 0;
      while (page.url().includes('news.google.com') && retries < 5) {
        await page.waitForTimeout(1500);
        retries++;
      }
      
      // Esperar a página carregar com timeout flexível
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      
      const finalUrl = page.url();
      logInfo(`[BrowserScraper] URL final: ${finalUrl} | UA: ${userAgent.substring(0, 30)}...`);

      // Remover elementos de ruído
      await page.evaluate(() => {
        const selectors = 'script, style, nav, footer, header, aside, iframe, noscript, .ads, .advertisement, .social-share, .comments, .cookie-banner, #onetrust-consent-sdk';
        document.querySelectorAll(selectors).forEach(el => el.remove());
      });

      // Extração de conteúdo
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
        
        const elements = Array.from(root.querySelectorAll('p, h1, h2, h3, li, div[class*="text"], div[class*="content"]'));
        
        return elements
          .map(el => (el as HTMLElement).innerText.trim())
          .filter(t => t.length > 40 && !t.includes('©') && !t.includes('Copyright'))
          .filter((t, i, arr) => arr.indexOf(t) === i)
          .join('\n\n');
      });

      const cleanContent = content.trim();
      
      if (cleanContent.length < 200) {
        logWarn(`[BrowserScraper] Conteúdo curto detectado (${cleanContent.length} chars) em ${url}`);
      } else {
        logInfo(`[BrowserScraper] Sucesso: ${cleanContent.length} caracteres extraídos.`);
      }

      return cleanContent || null;
    } catch (error: any) {
      logError(`[BrowserScraper] Falha crítica na extração de ${url}: ${error.message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }
}

export const browserScraper = new BrowserScraper();
