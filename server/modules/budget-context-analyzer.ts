
import { logInfo } from '../core/logger.ts';

export type BudgetScope = 'FEDERAL' | 'STATE' | 'MUNICIPAL';

export interface ScopeAnalysis {
  scope: BudgetScope;
  entityId: string; // ID do ente no SICONFI (1=Federal, 35=SP, etc)
  reason: string;
}

export class BudgetContextAnalyzer {
  /**
   * Determina o escopo orçamentário baseado no texto e metadados do autor
   */
  static determineScope(text: string, author?: string): ScopeAnalysis {
    const normalizedText = text.toLowerCase();
    
    // 1. Detecção por palavras-chave municipais
    const municipalKeywords = [
      'prefeitura', 'prefeito', 'vereador', 'bairro', 'rua', 'asfalto', 
      'coleta de lixo', 'posto de saúde', 'escola municipal', 'guarda municipal'
    ];
    
    if (municipalKeywords.some(k => normalizedText.includes(k))) {
      return {
        scope: 'MUNICIPAL',
        entityId: '3550308', // Exemplo: São Paulo Capital (precisaria de mapeamento real)
        reason: 'Palavras-chave indicam contexto municipal.'
      };
    }

    // 2. Detecção por palavras-chave estaduais
    const stateKeywords = [
      'governador', 'deputado estadual', 'polícia militar', 'pmesp', 
      'rodovia estadual', 'fatec', 'etec', 'secretaria de estado'
    ];

    if (stateKeywords.some(k => normalizedText.includes(k))) {
      return {
        scope: 'STATE',
        entityId: '35', // São Paulo Estado
        reason: 'Palavras-chave indicam contexto estadual.'
      };
    }

    // 3. Default: Federal
    return {
      scope: 'FEDERAL',
      entityId: '1',
      reason: 'Contexto padrão definido como Federal.'
    };
  }
}
