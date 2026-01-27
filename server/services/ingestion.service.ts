
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
  /**
   * Detecta o formato do arquivo baseado na URL ou Content-Type
   */
  private detectFormat(url: string): IngestionFormat {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'xlsx') return 'xlsx';
    if (ext === 'txt' || ext === 'md') return 'text';
    return 'html';
  }

  /**
   * Processa uma URL independente do formato e normaliza os dados
   */
  async ingest(url: string, options: { keywords?: string[] } = {}): Promise<IngestionResult | null> {
    const format = this.detectFormat(url);
    logInfo(`[IngestionService] Processando URL: ${url} (Formato: ${format})`);

    try {
      let result: IngestionResult | null = null;
      switch (format) {
        case 'pdf':
          result = await this.processPDF(url);
          break;
        case 'docx':
          result = await this.processDOCX(url);
          break;
        case 'xlsx':
          result = await this.processXLSX(url);
          break;
        case 'html':
        default:
          result = await this.processHTML(url);
          break;
      }

      if (!result) return null;

      // Normalização de dados extraídos
      result.metadata.normalized = normalizationService.process(result.content);
      
      if (result.metadata.normalized.date) {
        result.metadata.date = result.metadata.normalized.date;
      }

      // Se o conteúdo for muito longo (> 10k chars), aplicar chunking
      if (result.content.length > 10000 && options.keywords) {
        logInfo(`[IngestionService] Conteúdo longo detectado (${result.content.length} chars). Aplicando extração semântica.`);
        const chunks = chunkingService.chunkText(result.content);
        const relevantChunks = chunkingService.filterRelevantChunks(chunks, options.keywords);
        
        if (relevantChunks.length > 0) {
          result.content = relevantChunks.map(c => `[TRECHO ${c.index + 1}]: ${c.content}`).join('\n\n---\n\n');
          logInfo(`[IngestionService] Reduzido para ${relevantChunks.length} trechos relevantes.`);
        }
      }

      return result;
    } catch (error: any) {
      logError(`[IngestionService] Erro ao processar ${url}: ${error.message}`);
      return null;
    }
  }

  private async processPDF(url: string): Promise<IngestionResult> {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const buffer = Buffer.from(response.data);
    
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();
      await parser.destroy();

      let content = textResult.text || '';
      let ocrUsed = false;

      // Se o PDF não tiver texto (provavelmente digitalizado), tenta OCR
      if (content.trim().length < 50) {
        logWarn(`[IngestionService] PDF parece ser uma imagem digitalizada. Tentando OCR...`);
        content = await ocrService.recognize(buffer);
        ocrUsed = true;
      }

      return {
        content: content,
        format: 'pdf',
        metadata: {
          title: infoResult.info?.Title,
          author: infoResult.info?.Author,
          sourceUrl: url,
          pages: infoResult.total,
          ocrUsed: ocrUsed
        }
      };
    } catch (err: any) {
      throw new Error(`Falha no parser de PDF: ${err.message}`);
    }
  }

  private async processDOCX(url: string): Promise<IngestionResult> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const result = await mammoth.extractRawText({ buffer: Buffer.from(response.data) });
    return {
      content: result.value,
      format: 'docx',
      metadata: { sourceUrl: url }
    };
  }

  private async processXLSX(url: string): Promise<IngestionResult> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const workbook = XLSX.read(response.data, { type: 'buffer' });
    let content = '';
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      content += `--- Planilha: ${sheetName} ---\n`;
      content += XLSX.utils.sheet_to_txt(sheet) + '\n';
    });
    return {
      content,
      format: 'xlsx',
      metadata: { sourceUrl: url }
    };
  }

  private async processHTML(url: string): Promise<IngestionResult | null> {
    const htmlContent = await browserScraper.scrape(url);
    return htmlContent ? {
      content: htmlContent,
      format: 'html',
      metadata: { sourceUrl: url }
    } : null;
  }
}

export const ingestionService = new IngestionService();
