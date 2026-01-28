/**
 * Scout Interview Agent v1.0
 * 
 * Busca e extrai promessas de entrevistas, debates e podcasts
 * Fontes: YouTube, Roda Viva, Flow Podcast, etc.
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';

export interface InterviewSource {
  title: string;
  url: string;
  platform: string;
  date?: string;
  transcript?: string;
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
}

export class ScoutInterviewAgent {
  /**
   * Busca entrevistas do político em múltiplas plataformas
   */
  async search(politicianName: string): Promise<InterviewSource[]> {
    logInfo(`[ScoutInterview] Buscando entrevistas de: ${politicianName}`);

    const sources: InterviewSource[] = [];

    // 1. Buscar no YouTube via RSS (público)
    const youtubeResults = await this.searchYouTube(politicianName);
    sources.push(...youtubeResults);

    // 2. Buscar no Google News (entrevistas em texto)
    const newsResults = await this.searchNewsInterviews(politicianName);
    sources.push(...newsResults);

    logInfo(`[ScoutInterview] ${sources.length} entrevistas encontradas`);
    return sources;
  }

  /**
   * Busca vídeos no YouTube via RSS
   */
  private async searchYouTube(politicianName: string): Promise<InterviewSource[]> {
    const sources: InterviewSource[] = [];

    try {
      // Queries específicas para entrevistas
      const queries = [
        `${politicianName} entrevista`,
        `${politicianName} "Roda Viva"`,
        `${politicianName} "Flow Podcast"`,
        `${politicianName} debate`
      ];

      for (const query of queries) {
        try {
          // Usar YouTube RSS feed via busca do Google
          const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          
          // Como não temos API do YouTube, vamos usar Google News RSS como proxy
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' site:youtube.com')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
          
          const response = await axios.get(rssUrl, { timeout: 10000 });
          const xml = response.data;

          // Parse RSS
          const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

          for (const item of items.slice(0, 3)) {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/))?.[1] || 
                         (item.match(/<title>(.*?)<\/title>/))?.[1] || '';
            const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
            const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';

            if (link.includes('youtube.com') || link.includes('youtu.be')) {
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
   * Busca entrevistas em formato texto (portais de notícias)
   */
  private async searchNewsInterviews(politicianName: string): Promise<InterviewSource[]> {
    const sources: InterviewSource[] = [];

    try {
      const queries = [
        `"${politicianName}" entrevista exclusiva`,
        `"${politicianName}" "em entrevista"`,
        `"${politicianName}" declarou em entrevista`
      ];

      for (const query of queries) {
        try {
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
          const response = await axios.get(rssUrl, { timeout: 10000 });
          const xml = response.data;

          const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

          for (const item of items.slice(0, 2)) {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/))?.[1] || 
                         (item.match(/<title>(.*?)<\/title>/))?.[1] || '';
            const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
            const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Portal de Notícias';
            const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';

            sources.push({
              title: title.replace(/&amp;/g, '&'),
              url: link,
              platform: source,
              date: pubDate
            });
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
   * Extrai promessas de uma entrevista usando IA
   */
  async extractPromises(interview: InterviewSource, politicianName: string): Promise<InterviewPromise[]> {
    logInfo(`[ScoutInterview] Extraindo promessas de: ${interview.title}`);

    try {
      // Se não tiver transcrição, usar apenas o título
      const content = interview.transcript || interview.title;

      const prompt = `
VOCÊ É UM EXTRATOR DE PROMESSAS POLÍTICAS DO SETH VII.

FONTE: Entrevista de ${politicianName}
TÍTULO: ${interview.title}
PLATAFORMA: ${interview.platform}
DATA: ${interview.date || 'N/A'}

CONTEÚDO:
${content.substring(0, 5000)}

INSTRUÇÕES:
1. Extraia TODAS as promessas, compromissos e declarações de intenção
2. Inclua o contexto da promessa (pergunta do entrevistador, situação)
3. Classifique por categoria
4. Atribua confiança baseado na clareza e firmeza da declaração

RESPONDA APENAS JSON:
{
  "promises": [
    {
      "text": "texto da promessa",
      "category": "CATEGORIA",
      "context": "contexto da declaração",
      "confidence": 0-100
    }
  ]
}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[ScoutInterview] Resposta da IA não contém JSON válido`);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const promises = parsed.promises || [];

      return promises.map((p: any) => ({
        text: p.text,
        category: p.category || 'GERAL',
        source: interview,
        confidence: p.confidence || 50,
        context: p.context || ''
      }));

    } catch (error: any) {
      logError(`[ScoutInterview] Erro ao extrair promessas: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca e extrai promessas em um único fluxo
   */
  async searchAndExtract(politicianName: string): Promise<InterviewPromise[]> {
    const interviews = await this.search(politicianName);
    const allPromises: InterviewPromise[] = [];

    logInfo(`[ScoutInterview] Extraindo promessas de ${interviews.length} entrevistas...`);

    // Processar apenas as 3 primeiras para não sobrecarregar
    for (const interview of interviews.slice(0, 3)) {
      const promises = await this.extractPromises(interview, politicianName);
      allPromises.push(...promises);
    }

    logInfo(`[ScoutInterview] ${allPromises.length} promessas extraídas de entrevistas`);
    return allPromises;
  }
}

export const scoutInterviewAgent = new ScoutInterviewAgent();
