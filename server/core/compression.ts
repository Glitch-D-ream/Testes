import zlib from 'zlib';
import { logError } from './logger.ts';

/**
 * Módulo de compressão para otimizar o armazenamento de grandes volumes de texto/JSON.
 * Reduz o uso de disco no Supabase em até 90%.
 */
export class DataCompressor {
  /**
   * Comprime um objeto ou string usando Gzip.
   * Retorna uma string Base64 para fácil armazenamento em colunas de texto.
   */
  static compress(data: any): string {
    try {
      const content = typeof data === 'string' ? data : JSON.stringify(data);
      const buffer = zlib.gzipSync(content);
      return buffer.toString('base64');
    } catch (error) {
      logError('[Compression] Erro ao comprimir dados', error as Error);
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  }

  /**
   * Descomprime uma string Base64 (Gzip) de volta para o formato original.
   */
  static decompress(compressedData: string): any {
    try {
      const buffer = Buffer.from(compressedData, 'base64');
      const decompressed = zlib.gunzipSync(buffer).toString();
      
      try {
        return JSON.parse(decompressed);
      } catch {
        return decompressed;
      }
    } catch (error) {
      logError('[Compression] Erro ao descomprimir dados', error as Error);
      return compressedData;
    }
  }

  /**
   * Verifica se uma string parece estar comprimida (Base64 Gzip).
   */
  static isCompressed(data: string): boolean {
    // Verificação simples: Gzip sempre começa com H4sIA em Base64
    return typeof data === 'string' && data.startsWith('H4sIA');
  }
}
