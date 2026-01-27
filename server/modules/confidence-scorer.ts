
import { logInfo, logError } from '../core/logger.ts';

export interface DataSource {
  url: string;
  timestamp: Date;
  method: 'api' | 'scraping' | 'ocr';
  reputation?: number; // 0.0 a 1.0
}

/**
 * ConfidenceScorer
 * Calcula o nível de confiança de uma fonte de dados baseado em frescura, método e reputação.
 */
export class ConfidenceScorer {
  /**
   * Calcula o score de confiança de uma fonte (0.0 a 1.0)
   */
  static calculateSourceScore(source: DataSource): number {
    const weights = {
      method: { api: 1.0, scraping: 0.8, ocr: 0.6 },
      freshness: this.getFreshnessScore(source.timestamp),
      reputation: source.reputation || this.getReputationByUrl(source.url)
    };
    
    // Fórmula ponderada: 40% Método, 30% Frescura, 30% Reputação
    const score = (
      weights.method[source.method] * 0.4 +
      weights.freshness * 0.3 +
      weights.reputation * 0.3
    );
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Score de frescura: decai exponencialmente após 24h
   */
  private static getFreshnessScore(timestamp: Date): number {
    const hoursOld = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 0) return 1.0; // Futuro (erro de clock, mas tratamos como 1)
    
    // Decaimento exponencial: e^(-x/24)
    // 0h = 1.0, 24h = 0.36, 48h = 0.13
    return Math.exp(-hoursOld / 24);
  }

  /**
   * Atribui reputação baseada no domínio da URL
   */
  private static getReputationByUrl(url: string): number {
    const domain = new URL(url).hostname.toLowerCase();
    
    const highReputation = [
      'gov.br', 'tse.jus.br', 'camara.leg.br', 'senado.leg.br', // Oficiais
      'g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'valor.globo.com' // Grandes mídias
    ];
    
    const mediumReputation = [
      'uol.com.br', 'terra.com.br', 'cnnbrasil.com.br', 'bbc.com'
    ];

    if (highReputation.some(d => domain.endsWith(d))) return 1.0;
    if (mediumReputation.some(d => domain.endsWith(d))) return 0.7;
    
    return 0.4; // Fontes desconhecidas ou blogs
  }
}
