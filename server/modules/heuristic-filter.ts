
import nlp from 'compromise';
import { logInfo } from '../core/logger.ts';

/**
 * HeuristicFilter v1.0 - ULTRA-FAST DISTILLATION
 * Autor: Seth VII
 * Objetivo: Reduzir ruído e volume de dados antes do envio para IAs primárias.
 */
export class HeuristicFilter {
  private noisePatterns = [
    'publicidade', 'assine a folha', 'todos os direitos reservados',
    'previsão do tempo', 'confira também', 'leia mais', 'newsletter',
    'cookies', 'política de privacidade', 'fale conosco', 'expediente'
  ];

  private politicalKeywords = [
    'projeto', 'lei', 'proposta', 'votação', 'câmara', 'senado',
    'deputado', 'senador', 'ministro', 'governo', 'prefeitura',
    'verba', 'gasto', 'emenda', 'promessa', 'discurso', 'afirmou'
  ];

  /**
   * Destila o conteúdo bruto, mantendo apenas o que é relevante para a auditoria.
   */
  distill(content: string, targetName: string): string {
    if (!content || content.length < 500) return content;

    const startTime = Date.now();
    const lines = content.split('\n');
    const targetLower = targetName.toLowerCase();
    const targetParts = targetLower.split(' ');

    const filteredLines = lines.filter(line => {
      const l = line.toLowerCase().trim();
      if (l.length < 20) return false;

      // 1. Verificar se é ruído conhecido
      const isNoise = this.noisePatterns.some(p => l.includes(p));
      if (isNoise) return false;

      // 2. Verificar relevância direta (Nome do alvo)
      const mentionsTarget = targetParts.some(part => part.length > 3 && l.includes(part));
      
      // 3. Verificar relevância temática (Política/Ação)
      const hasPoliticalContext = this.politicalKeywords.some(k => l.includes(k));

      // Critério de manutenção: Menção direta OU (Contexto político E linha com densidade de informação)
      return mentionsTarget || (hasPoliticalContext && l.length > 60);
    });

    const distilled = filteredLines.join('\n\n').trim();
    const duration = Date.now() - startTime;

    logInfo(`[HeuristicFilter] Destilação concluída em ${duration}ms. Redução: ${Math.round((1 - distilled.length / content.length) * 100)}%`);
    
    return distilled.length > 300 ? distilled : content; // Fallback se o filtro for agressivo demais
  }

  /**
   * Extrai tópicos rápidos para ajudar na classificação inicial.
   */
  getQuickTopics(content: string): string[] {
    const doc = nlp(content);
    return doc.topics().out('array').slice(0, 10);
  }
}

export const heuristicFilter = new HeuristicFilter();
