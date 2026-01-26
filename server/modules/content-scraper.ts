
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export class ContentScraper {
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  ];

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Extrai o conteúdo principal de uma URL
   */
  async scrape(url: string): Promise<string | null> {
    // Não fazer scrape de arquivos binários ou oficiais conhecidos que já temos conteúdo
    if (url.endsWith('.pdf') || url.endsWith('.jpg') || url.endsWith('.png')) {
      return null;
    }

    try {
      logInfo(`[ContentScraper] Extraindo conteúdo de: ${url}`);
      
      // Se for link do Google News, precisamos seguir o redirecionamento para a URL real
      let targetUrl = url;
      if (url.includes('news.google.com/rss/articles')) {
        try {
          // Google News bloqueia HEAD as vezes, tentar GET com range pequeno
          const headRes = await axios.get(url, { 
            maxRedirects: 5, 
            timeout: 8000,
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html'
            }
          });
          targetUrl = headRes.request.res.responseUrl || url;
          logInfo(`[ContentScraper] URL real resolvida: ${targetUrl}`);
        } catch (e) {
          logWarn(`[ContentScraper] Falha ao resolver URL do Google News: ${url}`);
        }
      }

      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/'
        },
        timeout: 15000,
        maxRedirects: 10
      });

      const html = response.data;
      if (typeof html !== 'string') return null;

      const $ = cheerio.load(html);

      // Remover elementos irrelevantes
      $('script, style, nav, footer, header, aside, iframe, noscript, .ads, .advertisement, .social-share, .comments').remove();

      // Tentar encontrar o corpo do artigo em seletores comuns
      const selectors = [
        '.content-text__container', // G1
        'article',
        '.content-body',
        '.article-body',
        '.post-content',
        '.entry-content',
        '.main-content',
        'main',
        '#main-content',
        '.texto-noticia', // Comum em portais brasileiros
        '.materia-conteudo',
        '.entry-content-body',
        '.news-content',
        '.article__content',
        '.story-content',
        '.node-article'
      ];

      let mainContent = '';
      for (const selector of selectors) {
        const element = $(selector);
        if (element.length > 0) {
          // Pegar o texto de todos os parágrafos dentro do elemento
          const paragraphs = element.find('p').map((_, el) => $(el).text().trim()).get();
          if (paragraphs.length > 0) {
            mainContent = paragraphs.join('\n\n');
            break;
          }
        }
      }

      // Fallback: Se não encontrou por seletores, pegar todos os parágrafos do body que pareçam conteúdo
      if (!mainContent || mainContent.length < 150) {
        // Tentar pegar div.content-text__container p especificamente para G1 se o seletor falhar
        const g1Paragraphs = $('.content-text__container p').map((_, el) => $(el).text().trim()).get();
        const articleParagraphs = $('article p').map((_, el) => $(el).text().trim()).get();
        const divParagraphs = $('div p').map((_, el) => $(el).text().trim()).get();
        
        if (g1Paragraphs.length > 1) {
          mainContent = g1Paragraphs.join('\n\n');
        } else if (articleParagraphs.length > 1) {
          mainContent = articleParagraphs.join('\n\n');
        } else if (divParagraphs.length > 5) {
          mainContent = divParagraphs.filter(p => p.length > 40).join('\n\n');
        } else {
          const allParagraphs = $('p').map((_, el) => $(el).text().trim()).get();
          mainContent = allParagraphs
            .filter(p => p.length > 15) // Ainda mais agressivo
            .join('\n\n');
        }
      }
      
      // Se ainda estiver vazio, tentar pegar o texto de todas as divs que contenham muito texto
      if (!mainContent || mainContent.length < 100) {
        mainContent = $('div').map((_, el) => $(el).text().trim()).get()
          .filter(t => t.length > 100)
          .sort((a, b) => b.length - a.length)[0] || '';
      }

      // Limpeza final
      const cleanContent = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      if (cleanContent.length < 50) {
        logWarn(`[ContentScraper] Conteúdo extraído muito curto (${cleanContent.length} chars) para: ${url}`);
        return null;
      }

      logInfo(`[ContentScraper] Sucesso: ${cleanContent.length} caracteres extraídos.`);
      return cleanContent;
    } catch (error: any) {
      logWarn(`[ContentScraper] Falha ao extrair ${url}: ${error.message}`);
      return null;
    }
  }
}

export const contentScraper = new ContentScraper();
