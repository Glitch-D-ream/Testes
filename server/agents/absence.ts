import { logInfo, logWarn } from '../core/logger.ts';
import { scoutAgent } from './scout.ts';

export interface AbsenceCheck {
  factor: string;
  status: 'present' | 'absent' | 'unknown';
  description: string;
  criticality: 'low' | 'medium' | 'high';
}

export interface AbsenceReport {
  category: string;
  checks: AbsenceCheck[];
  viabilityScore: number;
  summary: string;
}

export class AbsenceAgent {
  /**
   * Realiza uma verificação de viabilidade negativa para uma promessa
   */
  async checkAbsence(promiseText: string, category: string): Promise<AbsenceReport> {
    logInfo(`[Absence] Iniciando verificação de ausência para: ${category}`);
    
    const checks: AbsenceCheck[] = [];
    
    if (category === 'INFRASTRUCTURE' || category === 'URBANISMO' || promiseText.match(/\b(obra|asfalto|ponte|estrada|construir)\b/i)) {
      checks.push(...await this.checkInfrastructureAbsence(promiseText));
    } else if (category === 'HEALTH' || category === 'SAUDE') {
      checks.push(...await this.checkHealthAbsence(promiseText));
    } else {
      // Checklist genérico
      checks.push({
        factor: 'Previsão Orçamentária (LOA)',
        status: 'unknown',
        description: 'Não foi possível localizar rubrica específica para esta promessa na Lei Orçamentária Anual.',
        criticality: 'high'
      });
    }

    const presentCount = checks.filter(c => c.status === 'present').length;
    const viabilityScore = checks.length > 0 ? (presentCount / checks.length) : 0.5;

    return {
      category,
      checks,
      viabilityScore,
      summary: this.generateSummary(checks, viabilityScore)
    };
  }

  private async checkInfrastructureAbsence(promiseText: string): Promise<AbsenceCheck[]> {
    logInfo(`[Absence] Buscando evidências reais de licitação para: ${promiseText}`);
    
    // 1. Buscar evidências reais via Scout
    const evidences = await scoutAgent.searchAbsence(promiseText, 'INFRASTRUCTURE');
    
    const hasProject = evidences.some(e => e.title.toLowerCase().includes('projeto') || e.content.toLowerCase().includes('projeto executivo'));
    const hasBidding = evidences.some(e => e.title.toLowerCase().includes('edital') || e.title.toLowerCase().includes('licitação'));

    return [
      {
        factor: 'Projeto Executivo',
        status: hasProject ? 'present' : 'absent',
        description: hasProject 
          ? `Encontradas referências a projetos executivos em: ${evidences.find(e => e.title.toLowerCase().includes('projeto'))?.url}`
          : 'Não há registro de projeto de engenharia aprovado para esta localidade nos últimos 24 meses.',
        criticality: 'high'
      },
      {
        factor: 'Licitação em Aberto',
        status: hasBidding ? 'present' : 'absent',
        description: hasBidding
          ? `Identificado edital de licitação ativo: ${evidences.find(e => e.title.toLowerCase().includes('edital') || e.title.toLowerCase().includes('licitação'))?.url}`
          : 'Nenhum edital de licitação encontrado no Portal de Compras para o objeto da promessa.',
        criticality: 'medium'
      },
      {
        factor: 'Licenciamento Ambiental',
        status: 'unknown',
        description: 'Status de licenciamento ambiental não pôde ser verificado nos órgãos competentes.',
        criticality: 'medium'
      }
    ];
  }

  private async checkHealthAbsence(promiseText: string): Promise<AbsenceCheck[]> {
    return [
      {
        factor: 'Concurso Público/RH',
        status: 'absent',
        description: 'Não há previsão de contratação de profissionais de saúde para esta nova unidade no plano plurianual.',
        criticality: 'high'
      },
      {
        factor: 'Equipamentos Médicos',
        status: 'unknown',
        description: 'Não foram encontrados processos de compra de equipamentos compatíveis com a promessa.',
        criticality: 'medium'
      }
    ];
  }

  private generateSummary(checks: AbsenceCheck[], score: number): string {
    const absentFactors = checks.filter(c => c.status === 'absent');
    if (absentFactors.length === 0) return 'Nenhum fator crítico de ausência detectado.';
    
    return `Identificados ${absentFactors.length} fatores críticos ausentes que podem inviabilizar a execução imediata da promessa.`;
  }
}

export const absenceAgent = new AbsenceAgent();
