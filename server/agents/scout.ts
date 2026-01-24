import axios from 'axios';
import { logInfo, logError } from '../core/logger.js';
import { saveScoutHistory, checkUrlExists } from '../core/database.js';

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

  async search(query: string): Promise<RawSource[]> {
    logInfo(`[Scout] Iniciando varredura multicanal para: ${query}`);
    
    const sources: RawSource[] = [];
    
    try {
      const rssResults = await this.fetchFromRSS(query);
      sources.push(...rssResults);

      if (sources.length < 3) {
        const webResults = await this.fetchFromWeb(query);
        sources.push(...webResults);
      }
      
      const newSources: RawSource[] = [];
      for (const source of sources) {
        if (!this.isValidUrl(source.url)) continue;
        
        const isTrusted = this.whitelist.some(domain => source.url.includes(domain));
        source.confidence = isTrusted ? 'high' : 'medium';

        const exists = await checkUrlExists(source.url);
        if (!exists) {
          await saveScoutHistory({
            url: source.url,
            title: source.title,
            content: source.content,
            source: source.source,
            politicianName: query,
            publishedAt: source.publishedAt
          });
          newSources.push(source);
        }
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

  private async fetchFromWeb(query: string): Promise<RawSource[]> {
    const prompt = `Liste 5 notícias reais e recentes do político brasileiro "${query}" com promessas ou declarações. Priorize fontes oficiais (.gov.br, .leg.br) e grandes portais. Retorne APENAS um array JSON: [{"title": "...", "url": "...", "content": "...", "source": "...", "date": "..."}]`;

    let retries = 3;
    const models = ['searchgpt', 'mistral', 'openai'];

    for (let i = 0; i < retries; i++) {
      try {
        const model = models[i];
        logInfo(`[Scout] Tentando busca web (Tentativa ${i + 1}) com modelo: ${model}`);
        
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `https://text.pollinations.ai/${encodedPrompt}?model=${model}&json=true`;
        
        const response = await axios.get(url, { timeout: 30000 });
        let content = response.data;
        
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
          } catch (e) {
            logError('[Scout] Erro ao parsear JSON da Web', e as Error);
            continue;
          }
        }
        
        const results = Array.isArray(content) ? content : (content.news || content.results || content.noticias || []);
        
        // Validação de Links Ativos (Prova de Vida)
        const validatedResults = [];
        for (const item of results) {
          const itemUrl = item.url || item.link;
          if (!itemUrl) continue;

          try {
            logInfo(`[Scout] Validando link: ${itemUrl}`);
            // Usamos um timeout curto para não travar a análise
            await axios.head(itemUrl, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            validatedResults.push(item);
          } catch (linkError) {
            logError(`[Scout] Link inválido ou inacessível: ${itemUrl}`);
            // Se for erro de método não permitido (405), ainda podemos considerar o link como existente
            if ((linkError as any).response?.status === 405) {
              validatedResults.push(item);
            }
          }
        }
        
        return validatedResults.map(item => ({
          title: item.title || item.titulo,
          url: item.url || item.link,
          content: item.content || item.snippet || item.resumo || '',
          source: item.source || item.fonte || 'Web Search',
          publishedAt: item.date || item.data,
          type: 'news',
          confidence: (item.url || '').includes('.gov.br') || (item.url || '').includes('.leg.br') ? 'high' : 'medium'
        }));
      } catch (error: any) {
        logError(`[Scout] Falha na tentativa ${i + 1} com modelo ${models[i]}`, error as Error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    return [];
  }

  private async fetchFromRSS(query: string): Promise<RawSource[]> {
    const feeds = [
      { name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
      { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' }
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
              content: item.description || item.content || '',
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
