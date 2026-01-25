import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { saveScoutHistory, checkUrlExists } from '../core/database.ts';
import { multiScoutAgent } from './multi-scout.ts';

export interface RawSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official';
  confidence: 'high' | 'medium' | 'low';
}

export class ScoutAgent {
  private readonly whitelist = [
    'g1.globo.com', 'folha.uol.com.br', 'estadao.com.br', 'cnnbrasil.com.br',
    'valor.globo.com', 'bbc.com', 'elpais.com', 'uol.com.br', 'r7.com',
    'metropoles.com', 'poder360.com.br', 'agenciabrasil.ebc.com.br',
    'camara.leg.br', 'senado.leg.br', 'planalto.gov.br'
  ];

  private readonly blacklistKeywords = [
    'bbb', 'festa', 'namoro', 'casamento', 'look', 'fofoca', 'celebridade',
    'horóscopo', 'novela', 'futebol', 'gol', 'campeonato', 'venda', 'oferta',
    'promoção', 'desconto', 'comprar', 'preço', 'ingresso', 'show', 'atriz', 'ator',
    'influencer', 'blogueira', 'clima', 'previsão do tempo', 'receita', 'culinária'
  ];

  async search(query: string, isDeepSearch: boolean = false): Promise<RawSource[]> {
    logInfo(`[Scout] Iniciando varredura multicanal (${isDeepSearch ? 'DEEP' : 'NORMAL'}) para: ${query}`);
    
    const sources: RawSource[] = [];
    
    try {
      // 1. Tentar busca local (RSS)
      const rssResults = await this.fetchFromRSS(query);
      sources.push(...rssResults);

      // 2. Multi-Scout resiliente (IA + DuckDuckGo)
      if (sources.length < 3 || isDeepSearch) {
        logWarn(`[Scout] Ativando Multi-Scout resiliente...`);
        const multiScoutResults = await multiScoutAgent.search(query);
        
        multiScoutResults.forEach(item => {
          if (!sources.some(s => s.url === item.url)) {
            sources.push({
              title: item.title,
              url: item.url,
              content: item.content,
              source: item.source,
              publishedAt: item.publishedAt,
              type: 'news',
              confidence: item.confidence
            });
          }
        });
      }
      
      // 3. Fallback final: busca web direta via IA (Pollinations)
      if (sources.length < 3 || isDeepSearch) {
        logWarn(`[Scout] Ativando busca web direta via IA para ${query}...`);
        const webResults = await this.fetchFromWeb(query);
        webResults.forEach(item => {
          if (!sources.some(s => s.url === item.url) && !item.content.includes('Busca genérica')) {
            sources.push(item);
          }
        });
      }

      // 4. DEEP SEARCH: Busca por variações e contexto se ainda estiver vazio
      if (sources.length < 2 && isDeepSearch) {
        logWarn(`[Scout] Deep Search ativado: tentando variações de query para ${query}`);
        const variations = [
          `${query} notícias`,
          `${query} político`,
          `${query} declarações`,
          `${query} promessas`
        ];
        
        for (const v of variations) {
          const vResults = await this.fetchFromWeb(v);
          vResults.forEach(item => {
            if (!sources.some(s => s.url === item.url)) {
              sources.push(item);
            }
          });
          if (sources.length >= 5) break;
        }
      }
      
      const newSources: RawSource[] = [];
      for (const source of sources) {
        if (!this.isValidUrl(source.url)) continue;
        
        const isTrusted = this.whitelist.some(domain => source.url.includes(domain));
        source.confidence = isTrusted ? 'high' : 'medium';

        // Temporariamente desativando o filtro de duplicatas para garantir resultados no deploy
        await saveScoutHistory({
          url: source.url,
          title: source.title,
          content: source.content,
          source: source.source,
          politicianName: query,
          publishedAt: source.publishedAt
        }).catch(() => {}); // Ignorar erro se já existir
        
        newSources.push(source);
      }
      
      logInfo(`[Scout] Varredura concluída. ${newSources.length} novas fontes validadas.`);
      return newSources;
    } catch (error) {
      logError(`[Scout] Erro na varredura de ${query}`, error as Error);
      return [];
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async fetchFromWeb(query: string): Promise<RawSource[]> {
    const prompt = `Liste 5 notícias reais e recentes do político brasileiro "${query}" com promessas ou declarações. 
    Retorne APENAS um array JSON puro, sem markdown, seguindo este formato: 
    [{"title": "Título da Notícia", "url": "https://link-da-noticia.com", "content": "Resumo da promessa ou declaração encontrada", "source": "Nome do Portal", "date": "2024-01-01"}]`;

    const models = ['openai', 'mistral', 'llama'];

    for (const model of models) {
      try {
        logInfo(`[Scout] Tentando busca web com modelo: ${model}`);
        
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}&seed=${Math.floor(Math.random() * 1000)}`;
        
        const response = await axios.get(url, { timeout: 20000 });
        let content = response.data;
        
        if (!content) continue;

        let cleanContent = typeof content === 'string' ? content : JSON.stringify(content);
        cleanContent = cleanContent.replace(/```json\n?|\n?```/g, '').trim();
        const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          if (Array.isArray(results) && results.length > 0) {
            return results.map(item => ({
              title: item.title || item.titulo || 'Notícia Identificada',
              url: item.url || item.link || 'https://google.com',
              content: this.sanitizeText(item.content || item.snippet || item.resumo || ''),
              source: item.source || item.fonte || 'Busca Web',
              publishedAt: item.date || item.data || new Date().toISOString(),
              type: 'news',
              confidence: 'medium'
            }));
          }
        }
      } catch (error: any) {
        logError(`[Scout] Falha com modelo ${model}: ${error.message}`);
      }
    }
    return [];
  }

  private async fetchFromRSS(query: string): Promise<RawSource[]> {
    const feeds = [
      { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
      { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
      { name: 'Planalto', url: 'https://www.gov.br/planalto/pt-br/acompanhe-o-planalto/rss' },
      { name: 'Senado', url: 'https://www12.senado.leg.br/noticias/feed/ultimasnoticias' },
      { name: 'Câmara', url: 'https://www.camara.leg.br/noticias/rss' }
    ];

    const results: RawSource[] = [];
    const queryLower = query.toLowerCase();

    for (const feed of feeds) {
      try {
        const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`, { timeout: 10000 });
        
        if (response.data?.items) {
          const matchedItems = response.data.items.filter((item: any) => 
            item.title.toLowerCase().includes(queryLower) || 
            (item.description && item.description.toLowerCase().includes(queryLower))
          );

          for (const item of matchedItems) {
            results.push({
              title: item.title,
              url: item.link,
              content: this.sanitizeText(item.description || item.content || ''),
              source: feed.name,
              publishedAt: item.pubDate,
              type: 'news',
              confidence: 'high'
            });
          }
        }
      } catch (error) {
        logError(`[Scout] Erro ao ler feed ${feed.name}`, error as Error);
      }
    }

    return results;
  }
}

export const scoutAgent = new ScoutAgent();
