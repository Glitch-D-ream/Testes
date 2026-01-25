/**
 * Scout Regional v1.0
 * Detecta o nível do político (Federal, Estadual, Municipal) e usa os adaptadores corretos
 * Integra: Câmara, Senado, ALESP, CMSP, Querido Diário
 */

import { logInfo, logWarn } from '../core/logger.ts';
import { officialSourcesSearch } from '../modules/official-sources-search.ts';
import { alespIntegration } from '../integrations/alesp.ts';
import { camaraSPIntegration } from '../integrations/camara-sp.ts';
import { queridoDiarioIntegration } from '../integrations/querido-diario.ts';
import { scoutHybrid } from './scout-hybrid.ts';

export interface RegionalSearchContext {
  name: string;
  office?: string;
  state?: string;
  city?: string;
  party?: string;
}

export interface RawSource {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  type: 'news' | 'social' | 'official';
  confidence: 'high' | 'medium' | 'low';
}

export class ScoutRegional {
  /**
   * Detecta o nível do político baseado no contexto fornecido
   */
  private detectLevel(context: RegionalSearchContext): 'federal' | 'state' | 'municipal' {
    const officeUpper = (context.office || '').toUpperCase();
    
    // Federal
    if (officeUpper.includes('DEPUTADO') && !officeUpper.includes('ESTADUAL')) return 'federal';
    if (officeUpper.includes('SENADOR')) return 'federal';
    if (officeUpper.includes('PRESIDENTE')) return 'federal';
    if (officeUpper.includes('VICE-PRESIDENTE')) return 'federal';
    
    // Estadual
    if (officeUpper.includes('DEPUTADO ESTADUAL')) return 'state';
    if (officeUpper.includes('GOVERNADOR')) return 'state';
    if (officeUpper.includes('VICE-GOVERNADOR')) return 'state';
    
    // Municipal
    if (officeUpper.includes('VEREADOR')) return 'municipal';
    if (officeUpper.includes('PREFEITO')) return 'municipal';
    if (officeUpper.includes('VICE-PREFEITO')) return 'municipal';
    
    // Se não conseguir detectar, usar a presença de cidade como indicador
    if (context.city) return 'municipal';
    if (context.state && !context.city) return 'state';
    
    return 'federal'; // Padrão
  }

  /**
   * Busca regional com priorização por nível
   */
  async search(context: RegionalSearchContext, deepSearch: boolean = false): Promise<RawSource[]> {
    const level = this.detectLevel(context);
    logInfo(`[ScoutRegional] Detectado nível: ${level} para ${context.name}`);
    
    const sources: RawSource[] = [];

    // FASE 1: Buscar em fontes oficiais do nível detectado
    if (level === 'federal') {
      logInfo(`[ScoutRegional] Buscando em fontes federais (Câmara, Senado)...`);
      const federalSources = await officialSourcesSearch.search(context.name);
      sources.push(...federalSources.map(s => ({
        title: s.title,
        url: s.url,
        content: s.content,
        source: s.source,
        publishedAt: new Date().toISOString(),
        type: 'official' as const,
        confidence: 'high' as const
      })));
    } else if (level === 'state') {
      logInfo(`[ScoutRegional] Buscando em fontes estaduais (ALESP)...`);
      const [deputados, proposicoes] = await Promise.all([
        alespIntegration.searchDeputado(context.name),
        alespIntegration.searchProposicoes(context.name)
      ]);
      sources.push(...deputados, ...proposicoes);
    } else if (level === 'municipal' && context.city?.toUpperCase() === 'SÃO PAULO') {
      logInfo(`[ScoutRegional] Buscando em fontes municipais (CMSP, Querido Diário)...`);
      const [vereadores, projetos, diarios] = await Promise.all([
        camaraSPIntegration.searchVereador(context.name).catch(() => []),
        camaraSPIntegration.searchProjetos(context.name).catch(() => []),
        queridoDiarioIntegration.searchMentions(context.name, context.city).catch(() => [])
      ]);
      sources.push(...vereadores, ...projetos, ...diarios);
    } else if (level === 'municipal') {
      logInfo(`[ScoutRegional] Buscando em fontes municipais (Querido Diário)...`);
      const diarios = await queridoDiarioIntegration.searchMentions(context.name, context.city);
      sources.push(...diarios);
    }

    // FASE 2: Se não encontrou nada, usar Scout Híbrido como fallback
    if (sources.length === 0) {
      logWarn(`[ScoutRegional] Nenhuma fonte oficial encontrada. Ativando Scout Híbrido...`);
      const query = [context.name, context.office, context.state, context.city]
        .filter(Boolean)
        .join(' ');
      const hybridSources = await scoutHybrid.search(query, deepSearch);
      sources.push(...hybridSources);
    }

    // FASE 3: Deep Search se ativado e ainda temos poucos resultados
    if (sources.length < 3 && deepSearch) {
      logInfo(`[ScoutRegional] Deep Search ativado (${sources.length} fontes). Expandindo busca...`);
      const query = [context.name, context.office, context.state, context.city]
        .filter(Boolean)
        .join(' ');
      const deepSources = await scoutHybrid.search(query, true);
      deepSources.forEach(s => {
        if (!sources.some(src => src.url === s.url)) {
          sources.push(s);
        }
      });
    }

    logInfo(`[ScoutRegional] Total de fontes encontradas: ${sources.length}`);
    return sources;
  }
}

export const scoutRegional = new ScoutRegional();
