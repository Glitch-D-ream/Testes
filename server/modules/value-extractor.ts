
import { logInfo } from '../core/logger.ts';

export class ValueExtractor {
  /**
   * Extrai o valor estimado da resposta da IA ou do texto original
   */
  static extractFromIAResponse(iaResponse: any, originalText: string): number {
    // 1. Tenta extrair do campo explícito da IA
    const possiblePaths = [
      iaResponse?.estimatedValue,
      iaResponse?.estimated_value,
      iaResponse?.cost?.value,
      iaResponse?.budget?.total
    ];

    for (const val of possiblePaths) {
      if (typeof val === 'number' && val > 0) return val;
      if (typeof val === 'string') {
        const parsed = this.parseCurrency(val);
        if (parsed && parsed > 0) return parsed;
      }
    }

    // 2. Fallback: Extração via Regex do texto original
    const fromText = this.parseCurrency(originalText);
    if (fromText && fromText > 0) {
      logInfo(`[ValueExtractor] Valor extraído do texto via Regex: R$ ${fromText.toLocaleString('pt-BR')}`);
      return fromText;
    }

    // 3. Último caso: Fallback neutro (reduzido para 100M para ser mais conservador que os 500M anteriores)
    return 100000000;
  }

  /**
   * Analisa strings de moeda brasileira (R$ 1.500.000,00, 2 milhões, etc)
   */
  static parseCurrency(text: string): number | null {
    if (!text) return null;

    // Regex para capturar números com multiplicadores (mil, milhões, bilhões)
    // Ex: "500 milhões", "1.5 bilhão", "R$ 200.000"
    // Captura valores com R$ OU valores seguidos de multiplicadores (evitando anos isolados)
    const regex = /(?:R\$\s*)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)|(\d+(?:[\.,]\d+)?)\s*(mil|mi|lhões|milhões|bi|lhões|bilhão|bilhões)/gi;
    
    let match;
    let maxValue = 0;

    while ((match = regex.exec(text)) !== null) {
      let currentVal = 0;
      
      if (match[3]) { // Tem multiplicador (milhões, bilhões)
        // Pega o número que vem antes do multiplicador (ex: "10" de "10 milhões")
        let numPart = (match[2] || match[1] || '').replace(/\./g, '').replace(',', '.');
        currentVal = parseFloat(numPart);
        const multiplier = match[3].toLowerCase();
        
        if (multiplier.includes('mil')) currentVal *= 1000;
        if (multiplier.includes('mi') || multiplier.includes('lhões')) currentVal *= 1000000;
        if (multiplier.includes('bi') || multiplier.includes('bilhão')) currentVal *= 1000000000;
      } else if (match[1]) { // Valor numérico formatado (R$ 1.234,56) sem multiplicador
        let cleanVal = match[1].replace(/\./g, '').replace(',', '.');
        currentVal = parseFloat(cleanVal);
      }

      if (currentVal > maxValue) maxValue = currentVal;
    }

    return maxValue > 0 ? maxValue : null;
  }
}
