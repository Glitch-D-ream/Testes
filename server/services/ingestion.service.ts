
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from '../modules/browser-scraper.ts';
import { chunkingService } from './chunking.service.ts';
import { normalizationService, NormalizedData } from './normalization.service.ts';
import { ocrService } from './ocr.service.ts';

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
  private detectFormat(url: string): IngestionFormat {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'xlsx') return 'xlsx';
    if (ext === 'txt' || ext === 'md') return 'text';
    return 'html';
  }

  async ingest(url: string, options: { keywords?: string[] } = {}): Promise<IngestionResult | null> {
    const format = this.detectFormat(url);
    logInfo(`[IngestionService] Processando URL: ${url} (Formato: ${format})`);

    try {
      let result: IngestionResult | null = null;
      
      // Fallback de Rede: Se o axios falhar, tentamos o browserScraper como proxy
      const fetchWithFallback = async (targetUrl: string) => {
        try {
          return await axios.get(targetUrl, { 
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
        } catch (e) {
          logWarn(`[IngestionService] Axios falhou para ${targetUrl}. Tentando via Scraper...`);
          const content = await browserScraper.scrape(targetUrl);
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

      if (!result) return null;

      // Se o conteúdo for muito longo, aplicar chunking para não estourar a IA
      if (result.content.length > 15000 && options.keywords) {
        const chunks = chunkingService.chunkText(result.content);
        const relevantChunks = chunkingService.filterRelevantChunks(chunks, options.keywords);
        if (relevantChunks.length > 0) {
          result.content = relevantChunks.map(c => c.content).join('\n\n[...]\n\n');
        }
      }

      return result;
    } catch (error: any) {
      logError(`[IngestionService] Falha crítica em ${url}: ${error.message}`);
      return null;
    }
  }

  private async processPDFBuffer(buffer: Buffer, url: string): Promise<IngestionResult> {
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      
      let content = textResult.text || '';
      let ocrUsed = false;

      if (content.trim().length < 100) {
        logWarn(`[IngestionService] PDF vazio ou imagem. Ativando OCR...`);
        content = await ocrService.recognize(buffer);
        ocrUsed = true;
      }

      return {
        content,
        format: 'pdf',
        metadata: { title: infoResult.info?.Title, sourceUrl: url, pages: infoResult.total, ocrUsed }
      };
    } catch (err: any) {
      logError(`[IngestionService] Falha no parser de PDF. Tentando extração bruta de strings...`);
      return { content: buffer.toString('utf8').replace(/[^\x20-\x7E\n]/g, ''), format: 'pdf', metadata: { sourceUrl: url } };
    }
  }
}

export const ingestionService = new IngestionService();
