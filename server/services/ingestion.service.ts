
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from '../modules/browser-scraper.ts';
import { chunkingService } from './chunking.service.ts';
import { normalizationService, NormalizedData } from './normalization.service.ts';
import { ocrService } from './ocr.service.ts';
import { IntelligentCache } from '../core/intelligent-cache.ts';

export type IngestionFormat = 'pdf' | 'docx' | 'xlsx' | 'html' | 'text' | 'unknown';

export interface IngestionResult {
  content: string;
  format: IngestionFormat;
  metadata: {
    title?: string;
    author?: string;
    date?: string;
    sourceUrl: string;
    pages?: number;
    normalized?: NormalizedData;
    ocrUsed?: boolean;
  };
}

/**
 * IngestionService v3.0 - PERFORMANCE OPTIMIZED
 * Estratégia "Lite-First": Tenta Axios/Cheerio antes de recorrer ao Playwright.
 */
export class IngestionService {
  private readonly AXIOS_TIMEOUT = 10000; 
  private readonly SCRAPER_TIMEOUT = 20000;

  private detectFormat(url: string): IngestionFormat {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'xlsx') return 'xlsx';
    if (ext === 'txt' || ext === 'md') return 'text';
    return 'html';
  }

  async ingest(url: string, options: { keywords?: string[] } = {}): Promise<IngestionResult | null> {
    return IntelligentCache.get(`ingest:${url}`, async () => {
      const format = this.detectFormat(url);
      logInfo(`[IngestionService] Analisando URL: ${url.substring(0, 60)}...`);
      
      try {
        let result: IngestionResult | null = null;

        // Estratégia para HTML: Tentar Axios primeiro (Muito mais leve que Playwright)
        if (format === 'html') {
          try {
            logInfo(`[IngestionService] Tentativa Lite (Axios) para HTML...`);
            const response = await axios.get(url, {
              timeout: this.AXIOS_TIMEOUT,
              headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
              }
            });

            if (response.status === 200 && typeof response.data === 'string') {
              const $ = cheerio.load(response.data);
              
              // Detecção de Paywall ou Bloqueio comum
              const pageTitle = $('title').text().toLowerCase();
              const bodyText = $('body').text().toLowerCase();
              const isBlocked = pageTitle.includes('access denied') || 
                               pageTitle.includes('403 forbidden') || 
                               bodyText.includes('paywall') ||
                               bodyText.includes('assinante');

              if (isBlocked) {
                logWarn(`[IngestionService] Bloqueio ou Paywall detectado via Axios. Recorrendo ao Scraper Pesado...`);
              } else {
                // Remover elementos ruidosos
                $('script, style, nav, footer, header, iframe, noscript, aside, .ads, .sidebar').remove();
                
                // Tentar focar no conteúdo principal primeiro
                const mainContent = $('article, main, .content, .post-content, .article-body, #main-content, .texto-materia').text().replace(/\s+/g, ' ').trim();
                const text = mainContent.length > 400 ? mainContent : $('body').text().replace(/\s+/g, ' ').trim();
                
                // Validação de Densidade: Aumentado para 500 chars para garantir conteúdo real
                if (text.length > 500) {
                  logInfo(`[IngestionService] Sucesso via Axios (${text.length} chars).`);
                  result = { 
                    content: text, 
                    format: 'html', 
                    metadata: { sourceUrl: url, title: $('title').text() } 
                  };
                } else {
                  logWarn(`[IngestionService] Conteúdo via Axios insuficiente (${text.length} chars). Tentando Scraper Pesado...`);
                }
              }
            }
          } catch (e) {
            logWarn(`[IngestionService] Axios falhou ou bloqueado. Recorrendo ao Playwright...`);
          }
        }

        // Se falhou no Axios ou é outro formato, segue o fluxo normal
        if (!result) {
          switch (format) {
            case 'pdf':
              const pdfRes = await axios.get(url, { 
                responseType: 'arraybuffer',
                timeout: this.AXIOS_TIMEOUT,
                headers: { 'User-Agent': 'Mozilla/5.0' }
              });
              result = await this.processPDFBuffer(Buffer.from(pdfRes.data), url);
              break;
            case 'html':
            default:
              logInfo(`[IngestionService] Iniciando Scraper Pesado (Playwright)...`);
              const htmlContent = await browserScraper.scrape(url);
              result = htmlContent ? { content: htmlContent, format: 'html', metadata: { sourceUrl: url } } : null;
              break;
          }
        }

        if (!result || !result.content || result.content.length < 300) {
          logWarn(`[IngestionService] Conteúdo final insuficiente (${result?.content?.length || 0} chars). Rejeitando fonte.`);
          return null;
        }

        // Limitar tamanho do conteúdo para não estourar memória/tokens
        if (result.content.length > 15000) {
          const chunks = chunkingService.chunkText(result.content);
          if (options.keywords && options.keywords.length > 0) {
            const relevantChunks = chunkingService.filterRelevantChunks(chunks, options.keywords);
            result.content = relevantChunks.length > 0 
              ? relevantChunks.map(c => c.content).join('\n\n[...]\n\n')
              : result.content.substring(0, 15000);
          } else {
            result.content = result.content.substring(0, 15000);
          }
        }

        return result;
      } catch (error: any) {
        logError(`[IngestionService] Erro fatal ao ingerir ${url}:`, error.message);
        return null;
      }
    }, 7 * 24 * 60 * 60 * 1000); // Cache de 7 dias
  }

  private async processPDFBuffer(buffer: Buffer, url: string): Promise<IngestionResult> {
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      
      let content = textResult.text || '';
      let ocrUsed = false;

      if (content.trim().length < 100 && buffer.length > 10000) {
        logWarn(`[IngestionService] PDF suspeito de imagem. Ativando OCR...`);
        content = await ocrService.recognize(buffer);
        ocrUsed = true;
      }

      return {
        content,
        format: 'pdf',
        metadata: { title: infoResult.info?.Title, sourceUrl: url, pages: infoResult.total, ocrUsed }
      };
    } catch (err: any) {
      return { content: "Erro ao processar PDF", format: 'pdf', metadata: { sourceUrl: url } };
    }
  }
}

export const ingestionService = new IngestionService();
