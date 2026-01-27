
import { createWorker } from 'tesseract.js';
import { logInfo, logError, logWarn } from '../core/logger.ts';

export class OCRService {
  /**
   * Realiza OCR em uma imagem ou buffer
   */
  async recognize(image: string | Buffer): Promise<string> {
    logInfo('[OCRService] Iniciando reconhecimento de texto...');
    const worker = await createWorker('por'); // Idioma Português
    
    try {
      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();
      logInfo(`[OCRService] Sucesso: ${text.length} caracteres reconhecidos.`);
      return text;
    } catch (error: any) {
      logError(`[OCRService] Falha no OCR: ${error.message}`);
      await worker.terminate();
      return '';
    }
  }

  /**
   * Tenta extrair texto de áreas específicas se o PDF falhar no parsing de texto comum
   */
  async processImageBuffer(buffer: Buffer): Promise<string> {
    return await this.recognize(buffer);
  }
}

export const ocrService = new OCRService();
