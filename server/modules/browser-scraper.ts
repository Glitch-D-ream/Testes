
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { chromium } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';

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
      
      // Otimização: Reduzir timeout de 25s para 12s e usar 'commit' para ser mais rápido
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
      
      // Lidar com redirecionamento do Google News (Otimizado: menos retries e delay menor)
      let retries = 0;
      while (page.url().includes('news.google.com') && retries < 3) {
        await page.waitForTimeout(800);
        retries++;
      }
      
      // Esperar a página carregar com timeout flexível (Otimizado: 8s -> 4s)
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
      
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
      logWarn(`[BrowserScraper] Playwright falhou, tentando fallback estático para ${url}: ${error.message}`);
      return await this.scrapeStatic(url);
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Fallback estático usando Axios e Cheerio para sites que não exigem JS pesado
   */
  private async scrapeStatic(url: string): Promise<string | null> {
    try {
      // Tentar resolver redirecionamentos (especialmente Google News)
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 8000,
        maxRedirects: 3
      });

      const $ = cheerio.load(response.data);
      
      // Se cair em página de redirecionamento do Google News (meta refresh)
      const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
      if (metaRefresh && metaRefresh.includes('url=')) {
        const nextUrl = metaRefresh.split('url=')[1];
        logInfo(`[BrowserScraper] Seguindo meta-refresh para: ${nextUrl}`);
        return await this.scrapeStatic(nextUrl);
      }
      
      // Remover ruído
      $('script, style, nav, footer, header, aside, .ads, .comments').remove();

      const selectors = [
        'article', 'main', '.content', '.post-content', '.entry-content', 
        '.materia-conteudo', '.texto-noticia'
      ];

      let content = '';
      for (const s of selectors) {
        const text = $(s).text().trim();
        if (text.length > 500) {
          content = text;
          break;
        }
      }

      if (!content) content = $('body').text().trim();

      const cleanContent = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n\n')
        .substring(0, 15000); // Limite de segurança

      logInfo(`[BrowserScraper] Sucesso via Fallback Estático: ${cleanContent.length} chars.`);
      return cleanContent.length > 200 ? cleanContent : null;
    } catch (e: any) {
      logError(`[BrowserScraper] Falha total na extração de ${url}: ${e.message}`);
      return null;
    }
  }
}

export const browserScraper = new BrowserScraper();
