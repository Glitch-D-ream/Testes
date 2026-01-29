/**
 * Scout Speech Agent v2.0
 * 
 * Busca e extrai promessas de discursos parlamentares
 * CORRIGIDO: Adiciona fallback para Google News quando API da Câmara não retorna dados
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';
import { getDeputadoId } from '../integrations/camara.ts';
import { contentScraper } from '../modules/content-scraper.ts';

export interface Speech {
  date: string;
  title: string;
  content: string;  // Renomeado de transcript para content
  url: string;
  chamber: 'CAMARA' | 'SENADO' | 'NEWS';
  session: string;
}

export interface SpeechPromise {
  text: string;
  category: string;
  source: Speech;
  confidence: number;
  context: string;
  quote?: string;
}

const CAMARA_API_BASE = 'https://dadosabertos.camara.leg.br/api/v2';

export class ScoutSpeechAgent {
  /**
   * Busca discursos de um político
   */
  async search(politicianName: string): Promise<Speech[]> {
    logInfo(`[ScoutSpeech] Buscando discursos de: ${politicianName}`);

    let speeches: Speech[] = [];

    // 1. Tentar buscar na API da Câmara
    const camaraSpeeches = await this.searchCamara(politicianName);
    speeches.push(...camaraSpeeches);

    // 2. Se a API da Câmara não retornou nada, usar fallback via Google News
    if (speeches.length === 0) {
      logInfo(`[ScoutSpeech] API da Câmara vazia. Usando fallback via Google News...`);
      const newsSpeeches = await this.searchNewsSpeeches(politicianName);
      speeches.push(...newsSpeeches);
    }

    logInfo(`[ScoutSpeech] ${speeches.length} discursos/declarações encontrados`);
    return speeches;
  }

  /**
   * Busca discursos na Câmara dos Deputados
   */
  private async searchCamara(politicianName: string): Promise<Speech[]> {
    const speeches: Speech[] = [];

    try {
      // 1. Buscar ID do deputado
      const deputadoId = await getDeputadoId(politicianName);
      if (!deputadoId) {
        logWarn(`[ScoutSpeech] Deputado não encontrado: ${politicianName}`);
        return [];
      }

      logInfo(`[ScoutSpeech] Deputado encontrado. ID: ${deputadoId}`);

      // 2. Buscar discursos do deputado
      const response = await axios.get(`${CAMARA_API_BASE}/deputados/${deputadoId}/discursos`, {
        params: {
          ordem: 'DESC',
          ordenarPor: 'dataHoraInicio',
          itens: 15
        },
        timeout: 15000
      }).catch(() => null);

      if (!response || !response.data?.dados) {
        logWarn(`[ScoutSpeech] API de discursos não retornou dados`);
        return [];
      }

      const discursos = response.data.dados;

      for (const discurso of discursos) {
        // Tentar buscar transcrição completa
        let content = discurso.transcricao || discurso.sumario || '';
        
        // Se não tem transcrição, pular
        if (!content || content.length < 100) {
          continue;
        }

        speeches.push({
          date: discurso.dataHoraInicio?.split('T')[0] || 'N/A',
          title: discurso.tipoDiscurso || 'Discurso Parlamentar',
          content: content,
          url: `https://www.camara.leg.br/deputados/${deputadoId}`,
          chamber: 'CAMARA',
          session: discurso.faseEvento?.titulo || 'Sessão Plenária'
        });
      }

    } catch (error: any) {
      logError(`[ScoutSpeech] Erro ao buscar discursos na Câmara: ${error.message}`);
    }

    return speeches;
  }

  /**
   * FALLBACK: Busca declarações e discursos via Google News
   * Usado quando a API da Câmara não retorna dados
   */
  private async searchNewsSpeeches(politicianName: string): Promise<Speech[]> {
    const speeches: Speech[] = [];

    try {
      const queries = [
        `"${politicianName}" discurso declaração`,
        `"${politicianName}" disse afirmou plenário`,
        `"${politicianName}" "em discurso"`,
        `"${politicianName}" prometeu anunciou`
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

            // Evitar duplicatas
            if (!speeches.find(s => s.url === link)) {
              speeches.push({
                date: pubDate,
                title: title.replace(/&amp;/g, '&'),
                content: '', // Será preenchido pelo scraping
                url: link,
                chamber: 'NEWS',
                session: source
              });
            }
          }
        } catch (e) {
          continue;
        }
      }

    } catch (error: any) {
      logWarn(`[ScoutSpeech] Erro ao buscar declarações via News: ${error.message}`);
    }

    return speeches;
  }

  /**
   * Faz scraping do conteúdo de uma notícia sobre discurso
   */
  async scrapeContent(speech: Speech): Promise<string | null> {
    // Se já tem conteúdo (da API da Câmara), não precisa fazer scraping
    if (speech.content && speech.content.length > 300) {
      return speech.content;
    }

    // Se é de NEWS, fazer scraping
    if (speech.chamber === 'NEWS') {
      logInfo(`[ScoutSpeech] Fazendo scraping de: ${speech.url}`);
      
      try {
        const content = await contentScraper.scrape(speech.url);
        
        if (!content || content.length < 300) {
          logWarn(`[ScoutSpeech] Conteúdo muito curto: ${speech.url}`);
          return null;
        }

        return content;
      } catch (error: any) {
        logError(`[ScoutSpeech] Erro no scraping: ${error.message}`);
        return null;
      }
    }

    return null;
  }

  /**
   * Extrai promessas de um discurso usando IA
   */
  async extractPromises(speech: Speech, politicianName: string): Promise<SpeechPromise[]> {
    logInfo(`[ScoutSpeech] Extraindo promessas de: ${speech.title}`);

    try {
      // Verificar se temos conteúdo suficiente
      if (!speech.content || speech.content.length < 200) {
        logWarn(`[ScoutSpeech] Sem conteúdo suficiente para: ${speech.title}`);
        return [];
      }

      // Limitar tamanho
      const limitedContent = speech.content.substring(0, 8000);

      const prompt = `
VOCÊ É UM EXTRATOR DE PROMESSAS POLÍTICAS DO SETH VII.

POLÍTICO ALVO: ${politicianName}
FONTE: ${speech.chamber === 'NEWS' ? speech.session : 'Câmara dos Deputados'}
DATA: ${speech.date}
TIPO: ${speech.title}
URL: ${speech.url}

CONTEÚDO DO DISCURSO/DECLARAÇÃO:
${limitedContent}

INSTRUÇÕES RIGOROSAS:
1. Extraia APENAS promessas, compromissos e declarações de intenção FEITAS POR ${politicianName}
2. NÃO invente promessas - extraia APENAS o que está explícito no texto
3. Inclua a CITAÇÃO DIRETA (entre aspas) quando disponível
4. Foque em compromissos FUTUROS (não relatos de ações passadas)
5. Se não houver promessas claras, retorne um array vazio
6. Classifique por categoria

RESPONDA APENAS JSON:
{
  "promises": [
    {
      "text": "resumo da promessa",
      "quote": "citação direta entre aspas",
      "category": "CATEGORIA",
      "context": "contexto/problema abordado",
      "confidence": 0-100
    }
  ]
}

SE NÃO HOUVER PROMESSAS CLARAS, RETORNE: {"promises": []}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[ScoutSpeech] Resposta da IA não contém JSON válido`);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const promises = parsed.promises || [];

      // Filtrar promessas inválidas
      const validPromises = promises.filter((p: any) => p.text && p.text.length > 20);

      return validPromises.map((p: any) => ({
        text: p.text,
        category: p.category || 'GERAL',
        source: speech,
        confidence: p.confidence || 50,
        context: p.context || '',
        quote: p.quote || ''
      }));

    } catch (error: any) {
      logError(`[ScoutSpeech] Erro ao extrair promessas: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca, faz scraping e extrai promessas em um único fluxo
   */
  async searchAndExtract(politicianName: string): Promise<SpeechPromise[]> {
    const speeches = await this.search(politicianName);
    const allPromises: SpeechPromise[] = [];

    logInfo(`[ScoutSpeech] Processando ${speeches.length} discursos/declarações...`);

    // Processar até 20 discursos - AUMENTADO de 5 para 20
    for (const speech of speeches.slice(0, 20)) {
      // PASSO 1: Fazer scraping se necessário
      const content = await this.scrapeContent(speech);
      
      if (content) {
        speech.content = content;
        
        // PASSO 2: Extrair promessas
        const promises = await this.extractPromises(speech, politicianName);
        allPromises.push(...promises);
        
        logInfo(`[ScoutSpeech] ${promises.length} promessas extraídas de: ${speech.title}`);
      }

      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    logInfo(`[ScoutSpeech] TOTAL: ${allPromises.length} promessas extraídas de discursos`);
    return allPromises;
  }
}

export const scoutSpeechAgent = new ScoutSpeechAgent();
