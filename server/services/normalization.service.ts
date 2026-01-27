
import { logInfo, logWarn } from '../core/logger.ts';

export interface NormalizedData {
  date?: string; // ISO format
  amount?: number;
  currency?: string;
  entities?: string[];
  originalText: string;
}

export class NormalizationService {
  /**
   * Normaliza datas de diversos formatos brasileiros para ISO
   */
  normalizeDate(text: string): string | null {
    // Formatos comuns: DD/MM/YYYY, DD de Mês de YYYY
    const ddmmyeaarRegex = /(\d{2})\/(\d{2})\/(\d{4})/;
    const writtenDateRegex = /(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i;

    const months: { [key: string]: string } = {
      janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06',
      julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
    };

    let match = text.match(ddmmyeaarRegex);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }

    match = text.match(writtenDateRegex);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = months[match[2].toLowerCase()];
      const year = match[3];
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  /**
   * Normaliza valores monetários (Real R$) para float
   */
  normalizeCurrency(text: string): number | null {
    // Busca padrão de moeda brasileira: R$ 1.234,56 ou apenas 1.234,56
    const currencyRegex = /(?:R\$\s?)?(\d{1,3}(?:\.\d{3})*,\d{2})/;
    const match = text.match(currencyRegex);
    
    if (!match) return null;

    try {
      // Pega o valor capturado, remove pontos de milhar e troca vírgula por ponto
      const normalized = match[1].replace(/\./g, '').replace(',', '.');
      const value = parseFloat(normalized);
      return isNaN(value) ? null : value;
    } catch (e) {
      return null;
    }
  }

  /**
   * Extrai entidades básicas usando regex (fallback para NLP) com filtragem de ruído
   */
  extractBasicEntities(text: string): string[] {
    const entities = new Set<string>();
    const stopwords = new Set(['Início', 'Conteúdo', 'Página', 'Brasília', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']);
    
    // Nomes Próprios (Iniciais maiúsculas seguidas, suportando conectores de/da/do)
    const nameRegex = /\b([A-Z][a-zÀ-ÿ]+(?:\s+(?:de|da|do|dos|das)\s+)?(?:[A-Z][a-zÀ-ÿ]+)+)\b/g;
    let match;
    while ((match = nameRegex.exec(text)) !== null) {
      const name = match[1];
      const firstWord = name.split(' ')[0];
      if (name.length > 5 && !stopwords.has(firstWord)) {
        entities.add(name);
      }
    }

    // Siglas (3+ letras maiúsculas)
    const acronymRegex = /\b([A-Z]{3,})\b/g;
    while ((match = acronymRegex.exec(text)) !== null) {
      entities.add(match[1]);
    }

    return Array.from(entities);
  }

  /**
   * Processa um texto bruto e retorna dados estruturados básicos
   */
  process(text: string): NormalizedData {
    logInfo(`[NormalizationService] Processando texto de ${text.length} caracteres.`);
    
    return {
      date: this.normalizeDate(text) || undefined,
      amount: this.normalizeCurrency(text) || undefined,
      currency: text.includes('R$') ? 'BRL' : undefined,
      entities: this.extractBasicEntities(text),
      originalText: text.substring(0, 500) // Amostra do original
    };
  }
}

export const normalizationService = new NormalizationService();
