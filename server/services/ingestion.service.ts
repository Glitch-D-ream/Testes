
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
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

export class IngestionService {
  private readonly AXIOS_TIMEOUT = 8000; 
  private readonly SCRAPER_TIMEOUT = 15000;

  private detectFormat(url: string): IngestionFormat {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'xlsx') return 'xlsx';
    if (ext === 'txt' || ext === 'md') return 'text';
    return 'html';
  }

  async ingest(url: string, options: { keywords?: string[] } = {}): Promise<IngestionResult | null> {
    // Implementação de Cache para evitar re-scraping da mesma URL
    return IntelligentCache.get(`ingest:${url}`, async () => {
      const format = this.detectFormat(url);
      logInfo(`[IngestionService] Ingerindo nova URL: ${url.substring(0, 50)}...`);
      
      try {
        let result: IngestionResult | null = null;
        
        const fetchWithFallback = async (targetUrl: string) => {
          try {
            return await axios.get(targetUrl, { 
              responseType: 'arraybuffer',
              timeout: this.AXIOS_TIMEOUT,
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
          } catch (e) {
            logWarn(`[IngestionService] Axios falhou para ${targetUrl.substring(0, 40)}... Tentando via Scraper...`);
            const scraperPromise = browserScraper.scrape(targetUrl);
            const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), this.SCRAPER_TIMEOUT));
            
            const content = await Promise.race([scraperPromise, timeoutPromise]);
            if (content) return { data: Buffer.from(content), status: 200 };
            throw e;
          }
        };

        switch (format) {
          case 'pdf':
            const pdfRes = await fetchWithFallback(url);
            result = await this.processPDFBuffer(Buffer.from(pdfRes.data), url);
            break;
          case 'html':
          default:
            const htmlContent = await browserScraper.scrape(url);
            result = htmlContent ? { content: htmlContent, format: 'html', metadata: { sourceUrl: url } } : null;
            break;
        }

        if (!result || !result.content || result.content.length < 50) return null;

        if (result.content.length > 12000) {
          const chunks = chunkingService.chunkText(result.content);
          if (options.keywords && options.keywords.length > 0) {
            const relevantChunks = chunkingService.filterRelevantChunks(chunks, options.keywords);
            result.content = relevantChunks.length > 0 
              ? relevantChunks.map(c => c.content).join('\n\n[...]\n\n')
              : result.content.substring(0, 12000);
          } else {
            result.content = result.content.substring(0, 12000);
          }
        }

        return result;
      } catch (error: any) {
        return null;
      }
    }, 7 * 24 * 60 * 60 * 1000); // Cache de conteúdo por 7 dias
  }

  private async processPDFBuffer(buffer: Buffer, url: string): Promise<IngestionResult> {
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      
      let content = textResult.text || '';
      let ocrUsed = false;

      if (content.trim().length < 100 && buffer.length > 10000) {
        logWarn(`[IngestionService] PDF suspeito de ser imagem. Ativando OCR...`);
        content = await ocrService.recognize(buffer);
        ocrUsed = true;
      }

      return {
        content,
        format: 'pdf',
        metadata: { title: infoResult.info?.Title, sourceUrl: url, pages: infoResult.total, ocrUsed }
      };
    } catch (err: any) {
      return { content: buffer.toString('utf8').replace(/[^\x20-\x7E\n]/g, '').substring(0, 5000), format: 'pdf', metadata: { sourceUrl: url } };
    }
  }
}

export const ingestionService = new IngestionService();
