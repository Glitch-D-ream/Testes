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
  profileType: 'PARLAMENTAR' | 'INFLUENCIADOR' | 'FIGURA_PUBLICA' | 'DESCONHECIDO';
}

/**
 * Base de dados local de figuras políticas conhecidas
 * Isso evita erros de classificação para pessoas famosas
 */
const KNOWN_FIGURES: Record<string, Partial<PoliticianProfile>> = {
  'jones manoel': {
    office: 'Influenciador Político / Historiador',
    party: 'PCB',
    state: 'PE',
    city: 'Recife',
    isHighProfile: true,
    profileType: 'INFLUENCIADOR'
  },
  'erika hilton': {
    office: 'Deputada Federal',
    party: 'PSOL',
    state: 'SP',
    city: 'São Paulo',
    isHighProfile: true,
    profileType: 'PARLAMENTAR'
  },
  'arthur lira': {
    office: 'Deputado Federal',
    party: 'PP',
    state: 'AL',
    city: 'Maceió',
    isHighProfile: true,
    profileType: 'PARLAMENTAR'
  },
  'nikolas ferreira': {
    office: 'Deputado Federal',
    party: 'PL',
    state: 'MG',
    city: 'Belo Horizonte',
    isHighProfile: true,
    profileType: 'PARLAMENTAR'
  },
  'glauber braga': {
    office: 'Deputado Federal',
    party: 'PSOL',
    state: 'RJ',
    city: 'Rio de Janeiro',
    isHighProfile: true,
    profileType: 'PARLAMENTAR'
  },
  'samia bomfim': {
    office: 'Deputada Federal',
    party: 'PSOL',
    state: 'SP',
    city: 'São Paulo',
    isHighProfile: true,
    profileType: 'PARLAMENTAR'
  }
};

export class TargetDiscoveryService {
  async discover(name: string): Promise<PoliticianProfile> {
    logInfo(`[TargetDiscovery] Iniciando descoberta autônoma para: ${name}`);
    
    const nameLower = name.toLowerCase().trim();
    
    // 1. Verificar na base de dados local de figuras conhecidas
    const knownFigure = KNOWN_FIGURES[nameLower];
    if (knownFigure) {
      logInfo(`[TargetDiscovery] Figura conhecida encontrada na base local: ${name}`);
      return {
        name: name,
        office: knownFigure.office || 'Figura Pública',
        party: knownFigure.party || 'Não identificado',
        state: knownFigure.state || 'Brasil',
        city: knownFigure.city,
        isHighProfile: knownFigure.isHighProfile || false,
        profileType: knownFigure.profileType || 'FIGURA_PUBLICA'
      };
    }
    
    // 2. Busca rápida por bio/perfil
    const searchResults = await directSearchImproved.search(`${name} cargo atual partido político`, false);
    const topResults = searchResults.slice(0, 3);
    
    if (topResults.length === 0) {
      logWarn(`[TargetDiscovery] Nenhuma fonte encontrada para ${name}. Usando perfil genérico.`);
      return this.getGenericProfile(name);
    }
    
    // 3. Extrair fragmentos de texto para a IA processar a identidade
    const snippets = topResults.map(r => `${r.title}: ${r.description}`).join('\n');
    
    try {
      const prompt = `Com base nos resultados de busca abaixo, identifique o cargo atual, partido e estado/cidade do político "${name}". 
      
      IMPORTANTE: 
      - Se "${name}" NÃO for um político eleito (deputado, senador, prefeito, governador, presidente), classifique como "Influenciador Político" ou "Figura Pública".
      - NÃO confunda menções a outros políticos no texto com o cargo do alvo.
      - Se não tiver certeza, use "Figura Pública" como cargo.
      
      Responda APENAS em JSON: {"office": "...", "party": "...", "state": "...", "city": "...", "isHighProfile": true/false, "profileType": "PARLAMENTAR|INFLUENCIADOR|FIGURA_PUBLICA"}
      
      Resultados:
      ${snippets}`;
      
      const aiResponse = await aiService.analyzeText(prompt);
      
      // Validar a resposta da IA
      const office = this.validateOffice(aiResponse.office, name, snippets);
      
      return {
        name: name,
        office: office,
        party: aiResponse.party || 'Não identificado',
        state: aiResponse.state || 'Brasil',
        city: aiResponse.city || '',
        isHighProfile: aiResponse.isHighProfile || false,
        profileType: aiResponse.profileType || 'FIGURA_PUBLICA'
      };
    } catch (error) {
      logWarn(`[TargetDiscovery] Falha na extração por IA. Usando heurística de texto.`);
      return this.heuristicDiscovery(name, snippets);
    }
  }

  /**
   * Valida se o cargo identificado faz sentido para o alvo
   */
  private validateOffice(office: string | undefined, name: string, text: string): string {
    if (!office) return 'Figura Pública';
    
    const officeLower = office.toLowerCase();
    const nameLower = name.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Se a IA disse que é "Presidente", verificar se o nome está realmente associado a esse cargo
    if (officeLower.includes('presidente')) {
      // Verificar se o texto diz explicitamente que o alvo É presidente
      const isActuallyPresident = 
        textLower.includes(`${nameLower} é presidente`) ||
        textLower.includes(`${nameLower}, presidente`) ||
        textLower.includes(`presidente ${nameLower}`) ||
        textLower.includes(`${nameLower} assumiu a presidência`);
      
      if (!isActuallyPresident) {
        logWarn(`[TargetDiscovery] Cargo "Presidente" rejeitado para ${name} - não há evidência direta.`);
        return 'Figura Pública';
      }
    }
    
    return office;
  }

  private heuristicDiscovery(name: string, text: string): PoliticianProfile {
    const t = text.toLowerCase();
    const nameLower = name.toLowerCase();
    
    let office = 'Figura Pública';
    let profileType: 'PARLAMENTAR' | 'INFLUENCIADOR' | 'FIGURA_PUBLICA' | 'DESCONHECIDO' = 'FIGURA_PUBLICA';
    
    // CORREÇÃO: Verificar se o cargo está ASSOCIADO ao nome do alvo
    // e não apenas se a palavra aparece no texto
    
    // Padrões que indicam que o alvo TEM o cargo
    const patterns = [
      { regex: new RegExp(`deputad[oa]\\s+(federal\\s+)?${nameLower}`, 'i'), office: 'Deputado Federal', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`${nameLower}\\s+(é|,)?\\s*deputad[oa]`, 'i'), office: 'Deputado Federal', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`senad(or|ora)\\s+${nameLower}`, 'i'), office: 'Senador', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`${nameLower}\\s+(é|,)?\\s*senad(or|ora)`, 'i'), office: 'Senador', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`vereador(a)?\\s+${nameLower}`, 'i'), office: 'Vereador', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`${nameLower}\\s+(é|,)?\\s*vereador`, 'i'), office: 'Vereador', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`prefeito\\s+${nameLower}`, 'i'), office: 'Prefeito', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`${nameLower}\\s+(é|,)?\\s*prefeito`, 'i'), office: 'Prefeito', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`governador\\s+${nameLower}`, 'i'), office: 'Governador', type: 'PARLAMENTAR' as const },
      { regex: new RegExp(`${nameLower}\\s+(é|,)?\\s*governador`, 'i'), office: 'Governador', type: 'PARLAMENTAR' as const },
      // Influenciadores
      { regex: new RegExp(`${nameLower}\\s+(é|,)?\\s*(youtuber|influenciador|historiador|professor|militante)`, 'i'), office: 'Influenciador Político', type: 'INFLUENCIADOR' as const },
    ];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(t)) {
        office = pattern.office;
        profileType = pattern.type;
        break;
      }
    }
    
    // Detectar partido
    let party = 'Em análise';
    const partyPatterns = [
      { regex: /\b(PT|PSOL|PCB|PSTU|PCO|UP)\b/i, party: '$1' },
      { regex: /\b(PL|PP|PSD|MDB|PSDB|DEM|UNIÃO)\b/i, party: '$1' },
    ];
    
    for (const pp of partyPatterns) {
      const match = t.match(pp.regex);
      if (match) {
        party = match[1].toUpperCase();
        break;
      }
    }
    
    // Detectar estado
    let state = 'Brasil';
    const statePatterns = [
      { regex: /pernambuco|recife/i, state: 'PE' },
      { regex: /são paulo|sp\b/i, state: 'SP' },
      { regex: /rio de janeiro|rj\b/i, state: 'RJ' },
      { regex: /minas gerais|mg\b/i, state: 'MG' },
      { regex: /alagoas|maceió/i, state: 'AL' },
    ];
    
    for (const sp of statePatterns) {
      if (sp.regex.test(t)) {
        state = sp.state;
        break;
      }
    }
    
    return {
      name,
      office,
      party,
      state,
      isHighProfile: false,
      profileType
    };
  }

  private getGenericProfile(name: string): PoliticianProfile {
    return {
      name,
      office: 'Figura Pública',
      party: 'Não identificado',
      state: 'Brasil',
      isHighProfile: false,
      profileType: 'DESCONHECIDO'
    };
  }
}

export const targetDiscoveryService = new TargetDiscoveryService();
