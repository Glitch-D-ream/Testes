import { FilteredSource } from './filter.ts';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { getSupabase } from '../core/database.ts';
import { validateBudgetViability, mapPromiseToSiconfiCategory } from '../integrations/siconfi.ts';
import { validateValueAgainstPIB } from '../integrations/ibge.ts';
import { temporalIncoherenceService } from '../services/temporal-incoherence.service.ts';
import { cacheService } from '../services/cache.service.ts';

export class BrainAgent {
  /**
   * O Cérebro Central 4.0 (Operação Tapa-Buraco): Desacoplado e Seguro
   */
  async analyze(politicianName: string, sources: FilteredSource[] = [], userId: string | null = null, existingAnalysisId: string | null = null, ignoreCache: boolean = false) {
    logInfo(`[Brain] Iniciando análise para: ${politicianName}`);
    
    try {
      // FLUXO 1: Perfil Oficial (SEMPRE ATIVO - Sem IA)
      const officialProfile = await this.generateOfficialProfile(politicianName, sources);
      
      // FLUXO 2: Análise de Intenção (OPCIONAL - Com IA)
      // Só roda se houver fontes válidas e o político for identificado
      let aiAnalysis = null;
      const validSources = sources.filter(s => s.source !== 'Generic Fallback' && s.content && s.content.length > 50);
      
      if (validSources.length > 0) {
        aiAnalysis = await this.generateAIAnalysis(politicianName, validSources, officialProfile);
      } else {
        logWarn(`[Brain] Fontes insuficientes para análise de IA em ${politicianName}.`);
      }

      // Consolidação dos Resultados
      const finalResult = this.consolidateResults(officialProfile, aiAnalysis);
      
      // Sanity Check Final
      this.rejectIfInsane(finalResult);

      // Persistência
      const savedAnalysis = await this.saveAnalysis(finalResult, userId, existingAnalysisId);
      
      return savedAnalysis;
    } catch (error) {
      logError(`[Brain] Falha na análise de ${politicianName}`, error as Error);
      throw error;
    }
  }

  private async generateOfficialProfile(politicianName: string, sources: FilteredSource[]) {
    logInfo(`[Brain] Gerando Perfil Oficial para ${politicianName}`);
    
    const mainCategory = this.detectMainCategory(sources);
    const siconfiCategory = mapPromiseToSiconfiCategory(mainCategory);
    const currentYear = new Date().getFullYear();
    
    // Dados Governamentais Crus
    const budgetViability = await validateBudgetViability(siconfiCategory, 500000000, currentYear - 1);
    const pibViability = await validateValueAgainstPIB(500000000);
    
    // Histórico Legislativo (Diz vs Faz)
    const promiseTexts = sources.map(s => s.content).filter(c => c && c.length > 0);
    const temporalAnalysis = await temporalIncoherenceService.analyzeIncoherence(politicianName, promiseTexts);

    return {
      politicianName,
      mainCategory,
      budgetViability,
      pibViability,
      temporalAnalysis,
      timestamp: new Date().toISOString()
    };
  }

  private async generateAIAnalysis(politicianName: string, sources: FilteredSource[], profile: any) {
    logInfo(`[Brain] Gerando Análise de IA para ${politicianName}`);
    
    const { aiService } = await import('../services/ai.service.ts');
    
    const knowledgeBase = sources
      .map(s => `### ${s.title}\n> ${s.content}`)
      .join('\n\n');

    const prompt = `
      AUDITORIA TÉCNICA: ${politicianName}
      CATEGORIA: ${profile.mainCategory}
      DADOS OFICIAIS: ${profile.budgetViability.reason}
      HISTÓRICO: ${profile.temporalAnalysis.summary}
      
      EVIDÊNCIAS:
      ${knowledgeBase}
      
      Gere um parecer técnico curto (máx 3 parágrafos) sobre a exequibilidade das intenções encontradas.
      Se não houver promessas claras, diga apenas: "Nenhuma promessa explícita detectada nas fontes fornecidas."
    `;

    try {
      const response = await aiService.generateReport(prompt);
      return response;
    } catch (error) {
      logError(`[Brain] Erro na IA`, error as Error);
      return "Análise de IA indisponível no momento.";
    }
  }

  private consolidateResults(profile: any, aiAnalysis: any) {
    return {
      ...profile,
      aiAnalysis: aiAnalysis || "Análise profunda não realizada por falta de evidências textuais.",
      confidence: aiAnalysis ? 85 : 100, // 100% se for apenas dados oficiais
      status: aiAnalysis ? 'full_analysis' : 'official_profile_only'
    };
  }

  private rejectIfInsane(data: any) {
    if (data.confidence > 100) {
      logError(`[SanityCheck] Confidence absurda detectada: ${data.confidence}%`, new Error('SANITY_FAIL'));
      data.confidence = 100; // Força correção
    }
    
    if (!data.politicianName || data.politicianName === 'Autor Desconhecido') {
      throw new Error('SANITY_FAIL: Político não identificado');
    }

    // Evitar o erro de 923% ou métricas impossíveis
    if (data.budgetViability && data.budgetViability.executionRate > 100) {
       logWarn(`[SanityCheck] Taxa de execução absurda corrigida: ${data.budgetViability.executionRate}%`);
       data.budgetViability.executionRate = 100;
    }
  }

  private async saveAnalysis(data: any, userId: string | null, existingId: string | null) {
    const supabase = getSupabase();
    const { analysisService } = await import('../services/analysis.service.ts');
    
    const analysisData = {
      user_id: userId,
      politician_name: data.politicianName,
      text: data.aiAnalysis,
      category: data.mainCategory,
      results: data,
      status: 'completed'
    };

    if (existingId) {
      await supabase.from('analyses').update(analysisData).eq('id', existingId);
      return { id: existingId, ...data };
    } else {
      const newAnalysis = await analysisService.createAnalysis(
        userId, 
        data.aiAnalysis, 
        data.politicianName, 
        data.mainCategory, 
        data
      );
      return newAnalysis;
    }
  }

  private detectMainCategory(sources: FilteredSource[]): string {
    const text = sources.map(s => (s.title + ' ' + s.content).toLowerCase()).join(' ');
    if (text.includes('saúde')) return 'SAUDE';
    if (text.includes('educação')) return 'EDUCACAO';
    if (text.includes('segurança')) return 'SEGURANCA';
    if (text.includes('economia')) return 'ECONOMIA';
    return 'GERAL';
  }
}

export const brainAgent = new BrainAgent();
