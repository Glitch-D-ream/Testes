/**
 * Scout Interview Agent v2.0
 * 
 * Busca e extrai promessas de entrevistas, debates e podcasts
 * CORRIGIDO: Agora faz scraping real do conteúdo das páginas
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
  content?: string;  // Conteúdo real da página (não mais transcript)
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
  quote?: string;  // Citação direta do político
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
   * PRIORIDADE: Fontes com texto completo
   */
  private async searchNewsInterviews(politicianName: string): Promise<InterviewSource[]> {
    const sources: InterviewSource[] = [];

    try {
      const queries = [
        `"${politicianName}" entrevista exclusiva`,
        `"${politicianName}" "em entrevista" disse`,
        `"${politicianName}" declarou promete`,
        `"${politicianName}" "vai fazer" promessa`
      ];

      for (const query of queries) {
        try {
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
          const response = await axios.get(rssUrl, { timeout: 10000 });
          const xml = response.data;

          const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

          for (const item of items.slice(0, 3)) {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/))?.[1] || 
                         (item.match(/<title>(.*?)<\/title>/))?.[1] || '';
            const link = (item.match(/<link>(.*?)<\/link>/))?.[1] || '';
            const source = (item.match(/<source[^>]*>(.*?)<\/source>/))?.[1] || 'Portal de Notícias';
            const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/))?.[1] || '';

            // Evitar duplicatas
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

          for (const item of items.slice(0, 2)) {
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
   * NOVO: Usa o contentScraper para extrair texto completo
   */
  async scrapeContent(interview: InterviewSource): Promise<string | null> {
    logInfo(`[ScoutInterview] Fazendo scraping de: ${interview.url}`);

    try {
      // Não fazer scraping de vídeos do YouTube (não tem texto)
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
   * Extrai promessas de uma entrevista usando IA
   * CORRIGIDO: Agora usa conteúdo real, não apenas título
   */
  async extractPromises(interview: InterviewSource, politicianName: string): Promise<InterviewPromise[]> {
    logInfo(`[ScoutInterview] Extraindo promessas de: ${interview.title}`);

    try {
      // CRÍTICO: Verificar se temos conteúdo real
      if (!interview.content || interview.content.length < 300) {
        logWarn(`[ScoutInterview] Sem conteúdo suficiente para extrair promessas de: ${interview.title}`);
        return [];
      }

      // Limitar tamanho do conteúdo para não estourar o contexto da IA
      const limitedContent = interview.content.substring(0, 8000);

      const prompt = `
VOCÊ É UM EXTRATOR DE PROMESSAS POLÍTICAS DO SETH VII.

POLÍTICO ALVO: ${politicianName}
FONTE: ${interview.platform}
TÍTULO: ${interview.title}
DATA: ${interview.date || 'N/A'}
URL: ${interview.url}

CONTEÚDO COMPLETO DA ENTREVISTA:
${limitedContent}

INSTRUÇÕES RIGOROSAS:
1. Extraia APENAS promessas, compromissos e declarações de intenção FEITAS POR ${politicianName}
2. NÃO invente promessas - extraia APENAS o que está explícito no texto
3. Inclua a CITAÇÃO DIRETA (entre aspas) quando disponível
4. Se não houver promessas claras, retorne um array vazio
5. Classifique por categoria (ECONOMIA, SAÚDE, EDUCAÇÃO, SEGURANÇA, INFRAESTRUTURA, POLÍTICA, etc)
6. Atribua confiança baseado na clareza e firmeza da declaração

RESPONDA APENAS JSON:
{
  "promises": [
    {
      "text": "resumo da promessa",
      "quote": "citação direta do político entre aspas",
      "category": "CATEGORIA",
      "context": "contexto em que a promessa foi feita",
      "confidence": 0-100
    }
  ]
}

SE NÃO HOUVER PROMESSAS CLARAS, RETORNE: {"promises": []}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[ScoutInterview] Resposta da IA não contém JSON válido`);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const promises = parsed.promises || [];

      // Filtrar promessas sem texto ou muito curtas
      const validPromises = promises.filter((p: any) => p.text && p.text.length > 20);

      return validPromises.map((p: any) => ({
        text: p.text,
        category: p.category || 'GERAL',
        source: interview,
        confidence: p.confidence || 50,
        context: p.context || '',
        quote: p.quote || ''
      }));

    } catch (error: any) {
      logError(`[ScoutInterview] Erro ao extrair promessas: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca, faz scraping e extrai promessas em um único fluxo
   * CORRIGIDO: Agora faz scraping real antes de extrair
   */
  async searchAndExtract(politicianName: string): Promise<InterviewPromise[]> {
    const interviews = await this.search(politicianName);
    const allPromises: InterviewPromise[] = [];

    logInfo(`[ScoutInterview] Processando ${interviews.length} entrevistas...`);

    // Processar apenas entrevistas de texto (não YouTube)
    const textInterviews = interviews.filter(i => 
      !i.url.includes('youtube.com') && !i.url.includes('youtu.be')
    );

    logInfo(`[ScoutInterview] ${textInterviews.length} entrevistas com texto disponível`);

    // Processar até 5 entrevistas
    for (const interview of textInterviews.slice(0, 5)) {
      // PASSO 1: Fazer scraping do conteúdo real
      const content = await this.scrapeContent(interview);
      
      if (content) {
        interview.content = content;
        
        // PASSO 2: Extrair promessas do conteúdo real
        const promises = await this.extractPromises(interview, politicianName);
        allPromises.push(...promises);
        
        logInfo(`[ScoutInterview] ${promises.length} promessas extraídas de: ${interview.title}`);
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logInfo(`[ScoutInterview] TOTAL: ${allPromises.length} promessas extraídas de entrevistas`);
    return allPromises;
  }
}

export const scoutInterviewAgent = new ScoutInterviewAgent();
