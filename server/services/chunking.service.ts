
import { logInfo } from '../core/logger.ts';

export interface DocumentChunk {
  content: string;
  index: number;
  metadata: any;
}

export class ChunkingService {
  /**
   * Divide um texto longo em chunks menores com sobreposição para manter o contexto
   */
  chunkText(text: string, chunkSize: number = 2000, overlap: number = 200): DocumentChunk[] {
    logInfo(`[ChunkingService] Dividindo texto de ${text.length} caracteres em chunks de ${chunkSize}.`);
    
    const chunks: DocumentChunk[] = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.substring(start, end);

      // Tentar ajustar o fim do chunk para o final de uma frase ou parágrafo
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > chunkSize * 0.8) {
          chunk = text.substring(start, start + breakPoint + 1);
        }
      }

      chunks.push({
        content: chunk.trim(),
        index: index++,
        metadata: {
          length: chunk.length,
          startOffset: start
        }
      });

      start += chunk.length - overlap;
      if (start < 0) start = 0;
      if (chunk.length <= overlap) break; // Evitar loop infinito se o chunk for menor que o overlap
    }

    return chunks;
  }

  /**
   * Filtra chunks relevantes baseados em palavras-chave (busca semântica simples)
   */
  filterRelevantChunks(chunks: DocumentChunk[], keywords: string[]): DocumentChunk[] {
    return chunks.filter(chunk => {
      const contentLower = chunk.content.toLowerCase();
      return keywords.some(kw => contentLower.includes(kw.toLowerCase()));
    });
  }
}

export const chunkingService = new ChunkingService();
