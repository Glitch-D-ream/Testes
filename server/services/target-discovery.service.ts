
import { directSearchImproved } from '../modules/direct-search-improved.ts';
import { ingestionService } from './ingestion.service.ts';
import { logInfo, logWarn } from '../core/logger.ts';
import { aiService } from './ai.service.ts';

export interface PoliticianProfile {
  name: string;
  office: string;
  party: string;
  state: string;
  city?: string;
  isHighProfile: boolean;
}

export class TargetDiscoveryService {
  async discover(name: string): Promise<PoliticianProfile> {
    logInfo(`[TargetDiscovery] Iniciando descoberta autônoma para: ${name}`);
    
    // 1. Busca rápida por bio/perfil
    const searchResults = await directSearchImproved.search(`${name} cargo atual partido político`, false);
    const topResults = searchResults.slice(0, 3);
    
    if (topResults.length === 0) {
      logWarn(`[TargetDiscovery] Nenhuma fonte encontrada para ${name}. Usando perfil genérico.`);
      return this.getGenericProfile(name);
    }

    // 2. Extrair fragmentos de texto para a IA processar a identidade
    const snippets = topResults.map(r => `${r.title}: ${r.description}`).join('\n');
    
    try {
      const prompt = `Com base nos resultados de busca abaixo, identifique o cargo atual, partido e estado/cidade do político "${name}". 
      Responda APENAS em JSON: {"office": "...", "party": "...", "state": "...", "city": "...", "isHighProfile": true/false}
      
      Resultados:
      ${snippets}`;

      const aiResponse = await aiService.analyzeText(prompt);
      
      return {
        name: name,
        office: aiResponse.office || 'Agente Político',
        party: aiResponse.party || 'Não identificado',
        state: aiResponse.state || 'Brasil',
        city: aiResponse.city || '',
        isHighProfile: aiResponse.isHighProfile || false
      };
    } catch (error) {
      logWarn(`[TargetDiscovery] Falha na extração por IA. Usando heurística de texto.`);
      return this.heuristicDiscovery(name, snippets);
    }
  }

  private heuristicDiscovery(name: string, text: string): PoliticianProfile {
    const t = text.toLowerCase();
    let office = 'Agente Político';
    if (t.includes('presidente')) office = 'Presidente';
    else if (t.includes('governador')) office = 'Governador';
    else if (t.includes('prefeito')) office = 'Prefeito';
    else if (t.includes('deputado federal')) office = 'Deputado Federal';
    else if (t.includes('senador')) office = 'Senador';
    else if (t.includes('ministro')) office = 'Ministro';

    return {
      name,
      office,
      party: 'Em análise',
      state: 'Brasil',
      isHighProfile: false
    };
  }

  private getGenericProfile(name: string): PoliticianProfile {
    return {
      name,
      office: 'Agente Político',
      party: 'Não identificado',
      state: 'Brasil',
      isHighProfile: false
    };
  }
}

export const targetDiscoveryService = new TargetDiscoveryService();
