/**
 * Scout Interview Agent v3.0 - INCISIVO
 * 
 * Busca e extrai promessas de entrevistas, debates e podcasts
 * COM ANÁLISE PROFUNDA: viabilidade, histórico, impacto, contradições
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';
import { contentScraper } from '../modules/content-scraper.ts';

export interface InterviewSource {
  title: string;
  url: string;
  platform: string;
  date?: string;
  content?: string;
  duration?: string;
  views?: number;
}

export interface InterviewPromise {
  text: string;
  category: string;
  source: InterviewSource;
  timestamp?: string;
  confidence: number;
  context: string;
  quote?: string;
  // NOVOS CAMPOS - Análise profunda
  viability: {
    score: number;  // 0-100
    analysis: string;
    obstacles: string[];
  };
  impact: {
    beneficiaries: string[];
    affected: string[];
    scale: 'LOCAL' | 'ESTADUAL' | 'NACIONAL';
  };
  historicalContext?: string;
  potentialContradictions?: string[];
}

export class ScoutInterviewAgent {
  /**
   * Busca entrevistas do político em múltiplas plataformas
   */
  async search(politicianName: string): Promise<InterviewSource[]> {
    logInfo(`[ScoutInterview] Buscando entrevistas de: ${politicianName}`);

    const sources: InterviewSource[] = [];

    // 1. Buscar entrevistas em texto (portais de notícias)
    const newsResults = await this.searchNewsInterviews(politicianName);
    sources.push(...newsResults);

    // 2. Buscar vídeos no YouTube (para referência)
    const youtubeResults = await this.searchYouTube(politicianName);
    sources.push(...youtubeResults);

    logInfo(`[ScoutInterview] ${sources.length} entrevistas encontradas`);
    return sources;
  }

  /**
   * Busca entrevistas em formato texto (portais de notícias)
   */
  private async searchNewsInterviews(politicianName: string): Promise<InterviewSource[]> {
    const sources: InterviewSource[] = [];

    try {
      const queries = [
        `"${politicianName}" entrevista exclusiva`,
        `"${politicianName}" "em entrevista" disse`,
        `"${politicianName}" declarou promete`,
        `"${politicianName}" "vai fazer" promessa`,
        `"${politicianName}" compromisso anunciou`
      ];

      for (const query of queries) {
        try {
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
          const response = await axios.get(rssUrl, { timeout: 10000 });
          const xml = response.data;

          const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

          for (const item of items.slice(0, 10)) { // AUMENTADO de 3 para 10
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/))?.[1] || 
                         (item.match(/<title>(.*?)<\/title>/))?.[1] || '';
            const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
            const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Portal de Notícias';
            const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';

            if (!sources.find(s => s.url === link)) {
              sources.push({
                title: title.replace(/&amp;/g, '&'),
                url: link,
                platform: source,
                date: pubDate
              });
            }
          }
        } catch (e) {
          continue;
        }
      }

    } catch (error: any) {
      logWarn(`[ScoutInterview] Erro ao buscar entrevistas em texto: ${error.message}`);
    }

    return sources;
  }

  /**
   * Busca vídeos no YouTube via Google News RSS
   */
  private async searchYouTube(politicianName: string): Promise<InterviewSource[]> {
    const sources: InterviewSource[] = [];

    try {
      const queries = [
        `${politicianName} entrevista completa`,
        `${politicianName} "Roda Viva"`,
        `${politicianName} podcast`
      ];

      for (const query of queries) {
        try {
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' site:youtube.com')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
          const response = await axios.get(rssUrl, { timeout: 10000 });
          const xml = response.data;

          const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

          for (const item of items.slice(0, 8)) { // AUMENTADO de 2 para 8
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/))?.[1] || 
                         (item.match(/<title>(.*?)<\/title>/))?.[1] || '';
            const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
            const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';

            if ((link.includes('youtube.com') || link.includes('youtu.be')) && 
                !sources.find(s => s.url === link)) {
              sources.push({
                title: title.replace(/&amp;/g, '&'),
                url: link,
                platform: 'YouTube',
                date: pubDate
              });
            }
          }
        } catch (e) {
          continue;
        }
      }

    } catch (error: any) {
      logWarn(`[ScoutInterview] Erro ao buscar no YouTube: ${error.message}`);
    }

    return sources;
  }

  /**
   * Faz scraping do conteúdo real de uma entrevista
   */
  async scrapeContent(interview: InterviewSource): Promise<string | null> {
    logInfo(`[ScoutInterview] Fazendo scraping de: ${interview.url}`);

    try {
      if (interview.url.includes('youtube.com') || interview.url.includes('youtu.be')) {
        logWarn(`[ScoutInterview] Pulando vídeo do YouTube (sem transcrição): ${interview.url}`);
        return null;
      }

      const content = await contentScraper.scrape(interview.url);

      if (!content || content.length < 300) {
        logWarn(`[ScoutInterview] Conteúdo muito curto ou vazio: ${interview.url}`);
        return null;
      }

      logInfo(`[ScoutInterview] Conteúdo extraído: ${content.length} caracteres`);
      return content;

    } catch (error: any) {
      logError(`[ScoutInterview] Erro no scraping: ${error.message}`);
      return null;
    }
  }

  /**
   * Extrai promessas de uma entrevista usando IA - VERSÃO INCISIVA
   */
  async extractPromises(interview: InterviewSource, politicianName: string): Promise<InterviewPromise[]> {
    logInfo(`[ScoutInterview] Extraindo promessas de: ${interview.title}`);

    try {
      if (!interview.content || interview.content.length < 300) {
        logWarn(`[ScoutInterview] Sem conteúdo suficiente para extrair promessas de: ${interview.title}`);
        return [];
      }

      const limitedContent = interview.content.substring(0, 10000);

      const prompt = `
VOCÊ É UM INVESTIGADOR POLÍTICO FORENSE DO SETH VII.
SUA MISSÃO: Extrair e ANALISAR CRITICAMENTE todas as promessas e compromissos do político.

═══════════════════════════════════════════════════════════════════════════════
POLÍTICO ALVO: ${politicianName}
FONTE: ${interview.platform}
TÍTULO: ${interview.title}
DATA: ${interview.date || 'N/A'}
URL: ${interview.url}
═══════════════════════════════════════════════════════════════════════════════

CONTEÚDO DA ENTREVISTA:
${limitedContent}

═══════════════════════════════════════════════════════════════════════════════
INSTRUÇÕES DE EXTRAÇÃO FORENSE:
═══════════════════════════════════════════════════════════════════════════════

1. EXTRAÇÃO DE PROMESSAS:
   - Identifique TODAS as promessas, compromissos e declarações de intenção
   - Inclua a CITAÇÃO DIRETA exata entre aspas
   - NÃO invente - extraia apenas o que está EXPLÍCITO no texto

2. ANÁLISE DE VIABILIDADE (para cada promessa):
   - É tecnicamente possível?
   - Há orçamento disponível?
   - Depende de aprovação de outros poderes?
   - Quais são os obstáculos reais?

3. ANÁLISE DE IMPACTO:
   - QUEM se beneficia diretamente?
   - QUEM pode ser prejudicado?
   - Qual a escala? (Local, Estadual, Nacional)

4. CONTEXTO HISTÓRICO:
   - O político já prometeu isso antes?
   - Há contradição com posições anteriores?
   - Qual o histórico dele nesse tema?

5. ALERTAS CRÍTICOS:
   - A promessa parece eleitoreira/populista?
   - Há interesses ocultos possíveis?
   - Quem financia campanhas relacionadas a esse tema?

═══════════════════════════════════════════════════════════════════════════════
RESPONDA APENAS JSON (seja INCISIVO e CRÍTICO):
═══════════════════════════════════════════════════════════════════════════════

{
  "promises": [
    {
      "text": "resumo objetivo da promessa",
      "quote": "citação EXATA do político entre aspas",
      "category": "ECONOMIA|SAÚDE|EDUCAÇÃO|SEGURANÇA|INFRAESTRUTURA|POLÍTICA|SOCIAL|MEIO_AMBIENTE",
      "context": "contexto em que a promessa foi feita",
      "viability": {
        "score": 0-100,
        "analysis": "análise crítica da viabilidade",
        "obstacles": ["obstáculo 1", "obstáculo 2"]
      },
      "impact": {
        "beneficiaries": ["quem ganha"],
        "affected": ["quem pode perder"],
        "scale": "LOCAL|ESTADUAL|NACIONAL"
      },
      "historicalContext": "o que sabemos sobre o histórico do político nesse tema",
      "potentialContradictions": ["possíveis contradições com posições anteriores"],
      "confidence": 0-100,
      "alerts": ["alerta crítico 1", "alerta crítico 2"]
    }
  ],
  "overallAssessment": {
    "totalPromises": número,
    "viablePromises": número,
    "populistAlerts": número,
    "summary": "avaliação geral das promessas em 2-3 frases INCISIVAS"
  }
}

SE NÃO HOUVER PROMESSAS CLARAS, RETORNE: {"promises": [], "overallAssessment": {"totalPromises": 0, "viablePromises": 0, "populistAlerts": 0, "summary": "Nenhuma promessa identificada no conteúdo."}}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[ScoutInterview] Resposta da IA não contém JSON válido`);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const promises = parsed.promises || [];

      const validPromises = promises.filter((p: any) => p.text && p.text.length > 20);

      return validPromises.map((p: any) => ({
        text: p.text,
        category: p.category || 'GERAL',
        source: interview,
        confidence: p.confidence || 50,
        context: p.context || '',
        quote: p.quote || '',
        viability: p.viability || { score: 50, analysis: 'Não analisado', obstacles: [] },
        impact: p.impact || { beneficiaries: [], affected: [], scale: 'NACIONAL' },
        historicalContext: p.historicalContext || '',
        potentialContradictions: p.potentialContradictions || []
      }));

    } catch (error: any) {
      logError(`[ScoutInterview] Erro ao extrair promessas: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca, faz scraping e extrai promessas em um único fluxo
   */
  async searchAndExtract(politicianName: string): Promise<InterviewPromise[]> {
    const interviews = await this.search(politicianName);
    const allPromises: InterviewPromise[] = [];

    logInfo(`[ScoutInterview] Processando ${interviews.length} entrevistas...`);

    const textInterviews = interviews.filter(i => 
      !i.url.includes('youtube.com') && !i.url.includes('youtu.be')
    );

    logInfo(`[ScoutInterview] ${textInterviews.length} entrevistas com texto disponível`);

    for (const interview of textInterviews.slice(0, 15)) { // AUMENTADO de 5 para 15
      const content = await this.scrapeContent(interview);
      
      if (content) {
        interview.content = content;
        const promises = await this.extractPromises(interview, politicianName);
        allPromises.push(...promises);
        
        logInfo(`[ScoutInterview] ${promises.length} promessas extraídas de: ${interview.title}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logInfo(`[ScoutInterview] TOTAL: ${allPromises.length} promessas extraídas de entrevistas`);
    return allPromises;
  }
}

export const scoutInterviewAgent = new ScoutInterviewAgent();
