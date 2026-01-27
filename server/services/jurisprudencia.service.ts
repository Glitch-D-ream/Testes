
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { browserScraper } from '../modules/browser-scraper.ts';

export interface JurisprudenciaItem {
  court: 'STF' | 'TSE';
  title: string;
  url: string;
  description: string;
  date?: string;
}

export class JurisprudenciaService {
  /**
   * Busca jurisprudência no STF e TSE
   */
  async search(politicianName: string): Promise<JurisprudenciaItem[]> {
    logInfo(`[JurisprudenciaService] Buscando decisões para: ${politicianName}`);
    
    const results: JurisprudenciaItem[] = [];
    
    try {
      // 1. Busca no STF (Simulada via URL de pesquisa)
      const stfSearchUrl = `https://jurisprudencia.stf.jus.br/pages/search?base=acordaos&pesquisa=${encodeURIComponent(politicianName)}`;
      results.push({
        court: 'STF',
        title: `Processos no STF: ${politicianName}`,
        url: stfSearchUrl,
        description: `Consulta de acórdãos e decisões monocráticas no Supremo Tribunal Federal relacionadas a ${politicianName}.`,
        date: new Date().toISOString()
      });

      // 2. Busca no TSE (Simulada via URL de pesquisa)
      const tseSearchUrl = `https://www.tse.jus.br/jurisprudencia/pesquisa-de-jurisprudencia?q=${encodeURIComponent(politicianName)}`;
      results.push({
        court: 'TSE',
        title: `Processos no TSE: ${politicianName}`,
        url: tseSearchUrl,
        description: `Consulta de decisões, resoluções e acórdãos no Tribunal Superior Eleitoral relacionados a ${politicianName}.`,
        date: new Date().toISOString()
      });

      logInfo(`[JurisprudenciaService] Encontradas ${results.length} fontes de tribunais.`);
    } catch (error: any) {
      logError(`[JurisprudenciaService] Erro na busca: ${error.message}`);
    }

    return results;
  }
}

export const jurisprudenciaService = new JurisprudenciaService();
