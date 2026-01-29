
import axios from 'axios';
import { logInfo, logWarn, logError } from '../core/logger.ts';
import { ingestionService } from '../services/ingestion.service.ts';
import { directSearchImproved } from '../modules/direct-search-improved.ts';

export interface LegalRecord {
  title: string;
  url: string;
  excerpt: string;
  source: string;
  date?: string;
  content?: string;
}

export class JusBrasilAlternative {
  /**
   * Busca processos e registros jurídicos usando busca pública real
   */
  async searchLegalRecords(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[LegalSearch] Buscando registros jurídicos REAIS para: ${politicianName}`);
    
    const queries = [
      `site:jusbrasil.com.br "${politicianName}"`,
      `site:escavador.com "${politicianName}"`,
      `"${politicianName}" processo judicial`,
      `"${politicianName}" diário oficial`
    ];

    const records: LegalRecord[] = [];

    try {
      // 1. Buscar links reais via DirectSearchImproved (DuckDuckGo/Bing)
      const searchPromises = queries.map(q => directSearchImproved.search(q).catch(() => []));
      const searchResults = await Promise.all(searchPromises);
      const flatResults = searchResults.flat().slice(0, 8);

      // 2. Ingerir conteúdo dos links encontrados para extrair dados reais
      const ingestionPromises = flatResults.map(async (r) => {
        try {
          const ingestion = await ingestionService.ingest(r.url, { keywords: [politicianName, 'processo', 'decisão', 'acusação'] });
          if (ingestion && ingestion.content.length > 200) {
            return {
              title: r.title,
              url: r.url,
              excerpt: ingestion.content.substring(0, 300) + "...",
              source: r.source || 'Justiça',
              content: ingestion.content
            };
          }
        } catch (e) {
          return null;
        }
        return null;
      });

      const realRecords = await Promise.all(ingestionPromises);
      records.push(...(realRecords.filter(r => r !== null) as LegalRecord[]));

    } catch (error) {
      logWarn(`[LegalSearch] Falha na busca de registros jurídicos reais`, error as Error);
    }

    return records;
  }

  /**
   * Integração com Querido Diário (Open Knowledge Brasil)
   * Busca em diários oficiais de diversos municípios de forma real
   */
  async searchQueridoDiario(politicianName: string): Promise<LegalRecord[]> {
    logInfo(`[QueridoDiario] Buscando em diários oficiais REAIS para: ${politicianName}`);
    
    try {
      // API do Querido Diário - Coleta Real
      const url = `https://queridodiario.ok.org.br/api/gazettes?keyword=${encodeURIComponent(politicianName)}`;
      const response = await axios.get(url, { timeout: 12000 });
      
      if (response.data?.gazettes && Array.isArray(response.data.gazettes)) {
        const gazettes = response.data.gazettes.slice(0, 5);
        
        // Tentar ingerir o conteúdo dos PDFs dos diários oficiais encontrados
        const ingestedGazettes = await Promise.all(gazettes.map(async (g: any) => {
          try {
            const ingestion = await ingestionService.ingest(g.url, { keywords: [politicianName] });
            return {
              title: `Diário Oficial: ${g.territory_name} (${g.state_code})`,
              url: g.url,
              excerpt: ingestion ? ingestion.content.substring(0, 300) + "..." : `Publicação em ${g.date}. Edição ${g.edition_number}.`,
              source: 'Querido Diário',
              date: g.date,
              content: ingestion?.content
            };
          } catch {
            return {
              title: `Diário Oficial: ${g.territory_name} (${g.state_code})`,
              url: g.url,
              excerpt: `Publicação em ${g.date}. Edição ${g.edition_number}.`,
              source: 'Querido Diário',
              date: g.date
            };
          }
        }));

        return ingestedGazettes;
      }
    } catch (error) {
      logWarn(`[QueridoDiario] Falha ao consultar API do Querido Diário`, error as Error);
    }
    
    return [];
  }
}

export const jusBrasilAlternative = new JusBrasilAlternative();
