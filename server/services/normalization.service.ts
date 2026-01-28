
import { logInfo, logWarn, logError } from '../core/logger.ts';
import { savePublicDataCache, getPublicDataCache } from '../core/database.ts';
import { createHash } from 'crypto';
import { z } from 'zod';
import { AIAnalysisResult } from './ai.service.ts';

/**
 * Schema rigoroso para validação do output da IA
 * Garante que o frontend e o banco de dados recebam dados íntegros
 */
const AIAnalysisSchema = z.object({
  promises: z.array(z.object({
    text: z.string().min(5),
    category: z.enum(['Saúde', 'Educação', 'Economia', 'Segurança', 'Infraestrutura', 'Geral']).default('Geral'),
    confidence: z.number().min(0).max(1).default(0.5),
    negated: z.boolean().default(false),
    conditional: z.boolean().default(false),
    reasoning: z.string().optional().default('Análise em processamento'),
    risks: z.array(z.string()).default([]),
    source_url: z.string().optional().or(z.literal('')),
    quote: z.string().optional()
  })).default([]),
  contradictions: z.array(z.object({
    topic: z.string(),
    discourse: z.any(),
    reality: z.any(),
    gapAnalysis: z.string()
  })).default([]),
  overallSentiment: z.string().default('Analítico'),
  credibilityScore: z.number().min(0).max(100).default(50),
  verdict: z.object({
    facts: z.array(z.string()).default([]),
    skepticism: z.array(z.string()).default([])
  }).default({ facts: [], skepticism: [] })
});

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
   * Limpa e valida o output bruto da IA
   */
  normalizeAIOutput(rawOutput: any): AIAnalysisResult {
    logInfo('[Normalization] Iniciando limpeza e validação de dados da IA...');
    
    try {
      // 1. Tentar extrair JSON se for string (comum em modelos que não suportam jsonMode nativo)
      let data = rawOutput;
      if (typeof rawOutput === 'string') {
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
        data = JSON.parse(jsonMatch ? jsonMatch[0] : rawOutput);
      }

      // 2. Validar contra o Schema Zod
      const validatedData = AIAnalysisSchema.parse(data);
      
      logInfo(`[Normalization] Validação concluída. ${validatedData.promises.length} promessas normalizadas.`);
      return validatedData as AIAnalysisResult;
    } catch (error: any) {
      logError(`[Normalization] Falha crítica na normalização: ${error.message}`);
      
      // Fallback: Retornar estrutura mínima válida para não quebrar o sistema
      return {
        promises: [],
        contradictions: [],
        overallSentiment: 'Erro na Normalização',
        credibilityScore: 0,
        verdict: { facts: [], skepticism: ['O sistema não conseguiu validar os dados da IA.'] }
      };
    }
  }

  /**
   * Processa um texto bruto e retorna dados estruturados básicos (com cache)
   */
  async process(text: string): Promise<NormalizedData> {
    const textHash = createHash('md5').update(text).digest('hex');
    const cacheKey = `norm_${textHash}`;

    try {
      const cached = await getPublicDataCache('NORMALIZATION', cacheKey);
      if (cached) {
        logInfo(`[NormalizationService] Cache hit para texto (hash: ${textHash})`);
        return cached as NormalizedData;
      }
    } catch (e) {
      logWarn('[NormalizationService] Falha ao acessar cache, processando normalmente');
    }

    logInfo(`[NormalizationService] Processando texto de ${text.length} caracteres (hash: ${textHash}).`);
    
    const result: NormalizedData = {
      date: this.normalizeDate(text) || undefined,
      amount: this.normalizeCurrency(text) || undefined,
      currency: text.includes('R$') ? 'BRL' : undefined,
      entities: this.extractBasicEntities(text),
      originalText: text.substring(0, 500) // Amostra do original
    };

    try {
      await savePublicDataCache('NORMALIZATION', cacheKey, result, 30); // Cache por 30 dias
    } catch (e) {
      logError('[NormalizationService] Erro ao salvar cache', e as Error);
    }

    return result;
  }
}

export const normalizationService = new NormalizationService();
