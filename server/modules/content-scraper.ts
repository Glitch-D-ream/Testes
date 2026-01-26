
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from './browser-scraper.ts';

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
    // Não fazer scrape de arquivos binários
    if (url.endsWith('.pdf') || url.endsWith('.jpg') || url.endsWith('.png')) {
      return null;
    }

    // Usar o BrowserScraper para links do Google News ou portais de notícias para garantir conteúdo completo
    const eliteDomains = ['news.google.com', 'globo.com', 'folha', 'estadao', 'cnnbrasil', 'poder360', 'metropoles', 'uol.com', 'gazetadopovo', 'correiobraziliense'];
    if (eliteDomains.some(domain => url.includes(domain))) {
      return await browserScraper.scrape(url);
    }

    try {
      logInfo(`[ContentScraper] Extraindo conteúdo via FastScrape (Cheerio): ${url}`);
      
      // Se for link do Google News, precisamos seguir o redirecionamento para a URL real
      let targetUrl = url;
      if (url.includes('news.google.com/rss/articles')) {
        try {
          // Google News bloqueia HEAD as vezes, tentar GET com range pequeno
          const headRes = await axios.get(url, { 
            maxRedirects: 10, 
            timeout: 12000,
            headers: { 
              'User-Agent': this.getRandomUserAgent(),
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Upgrade-Insecure-Requests': '1'
            }
          });
          targetUrl = headRes.request.res.responseUrl || url;
          
          // Se ainda for Google News, extrair a URL real do parâmetro codificado
          if (targetUrl.includes('news.google.com/rss/articles')) {
            try {
              const urlParts = targetUrl.split('/');
              let encodedUrl = urlParts[urlParts.length - 1].split('?')[0];
              
              // Google News usa um formato Base64 customizado para a URL real
              let cleanEncoded = encodedUrl.replace(/_/g, '/').replace(/-/g, '+');
              // Adicionar padding se necessário
              while (cleanEncoded.length % 4 !== 0) cleanEncoded += '=';
              
              const buffer = Buffer.from(cleanEncoded, 'base64');
              // Usar latin1 para evitar quebras de caracteres UTF-8 inválidos no binário
              const raw = buffer.toString('latin1');
              
              // Google News usa Protobuf. A URL real está no campo 1 ou 3.
              // Vamos procurar pela primeira ocorrência de http e extrair até um byte de controle
              const startIdx = raw.indexOf('http');
              if (startIdx !== -1) {
                let endIdx = raw.length;
                for (let i = startIdx; i < raw.length; i++) {
                  const charCode = raw.charCodeAt(i);
                  if (charCode < 32 || charCode > 126) {
                    endIdx = i;
                    break;
                  }
                }
                const extracted = raw.substring(startIdx, endIdx);
                if (extracted.includes('http') && !extracted.includes('google.com')) {
                  targetUrl = extracted;
                  logInfo(`[ContentScraper] URL real extraída via Protobuf Scan: ${targetUrl}`);
                }
              }
            } catch (e) {
              logWarn(`[ContentScraper] Falha ao decodificar URL Base64 do Google News`);
            }
          }
          
          // Fallback para meta refresh se a decodificação falhar
          if (targetUrl.includes('news.google.com')) {
            const $ = cheerio.load(headRes.data);
            const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
            if (metaRefresh) {
              const match = metaRefresh.match(/url=(.*)/i);
              if (match && match[1]) targetUrl = match[1];
            }
          }
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
        '.c-news__body', // CNN Brasil
        '.c-article__content', // CNN Brasil alt
        '.texto-materia', // Estadão
        '.c-content-text', // Folha
        '.article-content', // Geral
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
        '.node-article',
        '.text-content',
        '.body-text'
      ];

      let mainContent = '';
      for (const selector of selectors) {
        const element = $(selector);
        if (element.length > 0) {
          // Pegar o texto de todos os parágrafos dentro do elemento
          const paragraphs = element.find('p').map((_, el) => $(el).text().trim()).get();
          if (paragraphs.length > 2) { 
            mainContent = paragraphs.join('\n\n');
            if (mainContent.length > 400) break; // Sucesso real
          } 
          
          // Se não houver parágrafos suficientes ou texto for curto, tentar pegar o texto direto
          const directText = element.text().replace(/\s+/g, ' ').trim();
          if (directText.length > 500) {
            mainContent = directText;
            break;
          }
        }
      }

      // Fallback: Se não encontrou por seletores, pegar todos os parágrafos do body que pareçam conteúdo
      if (!mainContent || mainContent.length < 300) {
        const g1Paragraphs = $('.content-text__container p').map((_, el) => $(el).text().trim()).get();
        const articleParagraphs = $('article p').map((_, el) => $(el).text().trim()).get();
        
        if (g1Paragraphs.length > 2) {
          mainContent = g1Paragraphs.join('\n\n');
        } else if (articleParagraphs.length > 2) {
          mainContent = articleParagraphs.join('\n\n');
        } else {
          // Estratégia agressiva: pegar o texto de qualquer elemento que contenha muito texto
          const candidates: string[] = [];
          $('div, section, article').each((_, el) => {
            const text = $(el).clone().find('script, style, nav, footer').remove().end().text().trim();
            if (text.length > 500) candidates.push(text);
          });
          
          if (candidates.length > 0) {
            // Pegar o candidato com mais texto que não seja o body inteiro
            mainContent = candidates.sort((a, b) => b.length - a.length)[0];
          } else {
            const allParagraphs = $('p').map((_, el) => $(el).text().trim()).get();
            mainContent = allParagraphs.filter(p => p.length > 20).join('\n\n');
          }
        }
      }
      
      // Se ainda estiver vazio, tentar pegar o texto de todas as divs que contenham muito texto
      if (!mainContent || mainContent.length < 100) {
        mainContent = $('div').map((_, el) => $(el).text().trim()).get()
          .filter(t => t.length > 100)
          .sort((a, b) => b.length - a.length)[0] || '';
      }

      // Detecção de Entrevistas/Aspas
      const hasInterviewFormat = (mainContent.match(/\n[A-Z][^:]+: /g) || []).length > 3;
      const quoteCount = (mainContent.match(/"|“|”/g) || []).length;
      
      if (hasInterviewFormat) {
        logInfo(`[ContentScraper] Formato de entrevista detectado em: ${url}`);
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
