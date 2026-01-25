/**
 * Módulo de Tratamento de Erros de Busca
 * Fornece mensagens úteis e sugestões quando a busca falha
 */

import { logInfo, logError } from '../core/logger.ts';

export interface SearchErrorContext {
  politicianName: string;
  error: Error;
  attemptedStrategies: string[];
  resultsFound: number;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  suggestions: string[];
  fallbackAction?: string;
  code: string;
}

export class SearchErrorHandler {
  /**
   * Analisa o erro de busca e retorna uma resposta amigável com sugestões
   */
  handleSearchError(context: SearchErrorContext): ErrorResponse {
    logError(`[SearchErrorHandler] Erro ao buscar ${context.politicianName}`, context.error);

    const errorMessage = context.error.message.toLowerCase();

    // Erro 1: Nenhum resultado encontrado
    if (context.resultsFound === 0) {
      return this.handleNoResultsError(context);
    }

    // Erro 2: Timeout (API lenta ou indisponível)
    if (errorMessage.includes('timeout') || errorMessage.includes('econnrefused')) {
      return this.handleTimeoutError(context);
    }

    // Erro 3: Rate limit (muitas requisições)
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return this.handleRateLimitError(context);
    }

    // Erro 4: Figura pública não encontrada
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return this.handleNotFoundError(context);
    }

    // Erro 5: Erro genérico
    return this.handleGenericError(context);
  }

  /**
   * Tratamento: Nenhum resultado encontrado
   */
  private handleNoResultsError(context: SearchErrorContext): ErrorResponse {
    const suggestions = [
      `Verifique se o nome "${context.politicianName}" está correto (considere acentuação e ordem de nomes)`,
      'Tente buscar apenas pelo sobrenome ou primeiro nome',
      'Se é uma figura menos conhecida, tente adicionar o cargo (ex: "João Silva vereador")',
      'Verifique se é um político municipal, estadual ou federal',
      'Tente buscar em https://www.camara.leg.br ou https://www.senado.leg.br diretamente'
    ];

    return {
      success: false,
      message: `Não encontramos informações públicas sobre "${context.politicianName}". Isso pode significar que a figura é muito recente, muito local ou o nome foi digitado incorretamente.`,
      suggestions,
      fallbackAction: 'Você pode enviar um texto manualmente com as promessas que deseja analisar.',
      code: 'NO_RESULTS'
    };
  }

  /**
   * Tratamento: Timeout (APIs lentas)
   */
  private handleTimeoutError(context: SearchErrorContext): ErrorResponse {
    const suggestions = [
      'Os servidores de busca estão lentos no momento. Tente novamente em alguns minutos.',
      'Se o problema persistir, tente buscar manualmente em https://www.camara.leg.br',
      'Você pode enviar um texto com as promessas para análise manual'
    ];

    return {
      success: false,
      message: `A busca por "${context.politicianName}" levou muito tempo. Os servidores de busca podem estar sobrecarregados.`,
      suggestions,
      fallbackAction: 'Tente novamente em alguns minutos ou envie um texto manualmente.',
      code: 'TIMEOUT'
    };
  }

  /**
   * Tratamento: Rate limit (muitas requisições)
   */
  private handleRateLimitError(context: SearchErrorContext): ErrorResponse {
    const suggestions = [
      'Você fez muitas buscas em pouco tempo. Por favor, aguarde alguns minutos.',
      'Enquanto isso, você pode analisar manualmente enviando um texto com as promessas.',
      'Tente novamente em 5-10 minutos'
    ];

    return {
      success: false,
      message: `Limite de requisições atingido. Os servidores de busca limitam o número de consultas por minuto para evitar sobrecarga.`,
      suggestions,
      fallbackAction: 'Aguarde alguns minutos antes de tentar novamente.',
      code: 'RATE_LIMIT'
    };
  }

  /**
   * Tratamento: Figura pública não encontrada
   */
  private handleNotFoundError(context: SearchErrorContext): ErrorResponse {
    const suggestions = [
      `"${context.politicianName}" pode ser uma figura muito local ou recente`,
      'Verifique o nome exato em https://www.camara.leg.br ou https://www.senado.leg.br',
      'Se é um vereador ou prefeito, tente adicionar a cidade (ex: "João Silva São Paulo")',
      'Você pode enviar um texto manualmente com as promessas que deseja analisar'
    ];

    return {
      success: false,
      message: `Não encontramos "${context.politicianName}" nas bases de dados públicas. Isso pode significar que é uma figura muito local.`,
      suggestions,
      fallbackAction: 'Envie um texto com as promessas para análise manual.',
      code: 'NOT_FOUND'
    };
  }

  /**
   * Tratamento: Erro genérico
   */
  private handleGenericError(context: SearchErrorContext): ErrorResponse {
    const suggestions = [
      'Tente novamente em alguns momentos',
      'Verifique se o nome está correto',
      'Se o problema persistir, envie um texto manualmente com as promessas',
      'Contate o suporte se o erro continuar'
    ];

    return {
      success: false,
      message: `Ocorreu um erro ao buscar informações sobre "${context.politicianName}". Por favor, tente novamente.`,
      suggestions,
      fallbackAction: 'Envie um texto manualmente ou tente novamente mais tarde.',
      code: 'GENERIC_ERROR'
    };
  }

  /**
   * Gera uma mensagem amigável para exibir no frontend
   */
  generateUserFriendlyMessage(errorResponse: ErrorResponse): string {
    let message = `❌ ${errorResponse.message}\n\n`;
    
    if (errorResponse.suggestions.length > 0) {
      message += `💡 **Sugestões:**\n`;
      errorResponse.suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n`;
      });
    }

    if (errorResponse.fallbackAction) {
      message += `\n✅ **Alternativa:** ${errorResponse.fallbackAction}`;
    }

    return message;
  }

  /**
   * Determina se a busca deve ser retentada automaticamente
   */
  shouldRetry(errorResponse: ErrorResponse): boolean {
    return errorResponse.code === 'TIMEOUT' || errorResponse.code === 'RATE_LIMIT';
  }

  /**
   * Calcula o tempo de espera antes de retentativa (em ms)
   */
  getRetryDelay(errorResponse: ErrorResponse, attemptNumber: number = 1): number {
    if (errorResponse.code === 'RATE_LIMIT') {
      // Exponential backoff para rate limit
      return Math.min(1000 * Math.pow(2, attemptNumber), 30000);
    }
    
    if (errorResponse.code === 'TIMEOUT') {
      // Espera linear para timeout
      return 3000 * attemptNumber;
    }

    return 0;
  }
}

export const searchErrorHandler = new SearchErrorHandler();
