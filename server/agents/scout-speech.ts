/**
 * Scout Speech Agent v1.0
 * 
 * Busca e extrai promessas de discursos parlamentares
 * Fonte: API da Câmara dos Deputados e Senado Federal
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from '../services/ai-resilience-nexus.ts';
import { getDeputadoId } from '../integrations/camara.ts';

export interface Speech {
  date: string;
  title: string;
  transcript: string;
  url: string;
  chamber: 'CAMARA' | 'SENADO';
  session: string;
}

export interface SpeechPromise {
  text: string;
  category: string;
  source: Speech;
  confidence: number;
  context: string;
}

const CAMARA_API_BASE = 'https://dadosabertos.camara.leg.br/api/v2';

export class ScoutSpeechAgent {
  /**
   * Busca discursos de um político
   */
  async search(politicianName: string): Promise<Speech[]> {
    logInfo(`[ScoutSpeech] Buscando discursos de: ${politicianName}`);

    const speeches: Speech[] = [];

    // Buscar na Câmara dos Deputados
    const camaraSpeeches = await this.searchCamara(politicianName);
    speeches.push(...camaraSpeeches);

    logInfo(`[ScoutSpeech] ${speeches.length} discursos encontrados`);
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
          itens: 10 // Limitar a 10 discursos mais recentes
        },
        timeout: 15000
      });

      const discursos = response.data?.dados || [];

      for (const discurso of discursos) {
        // Buscar transcrição completa
        try {
          const detailResp = await axios.get(`${CAMARA_API_BASE}/deputados/${deputadoId}/discursos/${discurso.id}`, {
            timeout: 10000
          });

          const detail = detailResp.data?.dados || {};

          speeches.push({
            date: discurso.dataHoraInicio?.split('T')[0] || 'N/A',
            title: discurso.tipoDiscurso || 'Discurso Parlamentar',
            transcript: detail.transcricao || discurso.sumario || '',
            url: `https://www.camara.leg.br/deputados/${deputadoId}/discursos/${discurso.id}`,
            chamber: 'CAMARA',
            session: discurso.faseEvento?.titulo || 'Sessão Plenária'
          });

        } catch (e) {
          // Se falhar ao buscar detalhes, usar apenas o sumário
          speeches.push({
            date: discurso.dataHoraInicio?.split('T')[0] || 'N/A',
            title: discurso.tipoDiscurso || 'Discurso Parlamentar',
            transcript: discurso.sumario || '',
            url: `https://www.camara.leg.br/deputados/${deputadoId}`,
            chamber: 'CAMARA',
            session: discurso.faseEvento?.titulo || 'Sessão Plenária'
          });
        }
      }

    } catch (error: any) {
      logError(`[ScoutSpeech] Erro ao buscar discursos na Câmara: ${error.message}`);
    }

    return speeches;
  }

  /**
   * Extrai promessas de um discurso usando IA
   */
  async extractPromises(speech: Speech, politicianName: string): Promise<SpeechPromise[]> {
    logInfo(`[ScoutSpeech] Extraindo promessas de discurso: ${speech.title}`);

    try {
      // Limitar tamanho da transcrição
      const limitedTranscript = speech.transcript.substring(0, 5000);

      const prompt = `
VOCÊ É UM EXTRATOR DE PROMESSAS POLÍTICAS DO SETH VII.

FONTE: Discurso parlamentar de ${politicianName}
DATA: ${speech.date}
LOCAL: ${speech.chamber} - ${speech.session}
TÍTULO: ${speech.title}

TRANSCRIÇÃO:
${limitedTranscript}

INSTRUÇÕES:
1. Extraia TODAS as promessas, compromissos e declarações de intenção
2. Foque em compromissos FUTUROS (não relatos de ações passadas)
3. Inclua o contexto (qual problema está sendo abordado)
4. Classifique por categoria
5. Atribua confiança baseado na clareza e firmeza

RESPONDA APENAS JSON:
{
  "promises": [
    {
      "text": "texto da promessa",
      "category": "CATEGORIA",
      "context": "contexto/problema abordado",
      "confidence": 0-100
    }
  ]
}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[ScoutSpeech] Resposta da IA não contém JSON válido`);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const promises = parsed.promises || [];

      return promises.map((p: any) => ({
        text: p.text,
        category: p.category || 'GERAL',
        source: speech,
        confidence: p.confidence || 50,
        context: p.context || ''
      }));

    } catch (error: any) {
      logError(`[ScoutSpeech] Erro ao extrair promessas: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca e extrai promessas em um único fluxo
   */
  async searchAndExtract(politicianName: string): Promise<SpeechPromise[]> {
    const speeches = await this.search(politicianName);
    const allPromises: SpeechPromise[] = [];

    logInfo(`[ScoutSpeech] Extraindo promessas de ${speeches.length} discursos...`);

    // Processar apenas os 5 primeiros discursos
    for (const speech of speeches.slice(0, 5)) {
      // Só processar se tiver transcrição
      if (speech.transcript && speech.transcript.length > 100) {
        const promises = await this.extractPromises(speech, politicianName);
        allPromises.push(...promises);
      }
    }

    logInfo(`[ScoutSpeech] ${allPromises.length} promessas extraídas de discursos`);
    return allPromises;
  }
}

export const scoutSpeechAgent = new ScoutSpeechAgent();
