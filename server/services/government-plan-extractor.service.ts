/**
 * Government Plan Extractor Service v2.0
 * 
 * Extrai promessas do Plano de Governo oficial registrado no TSE
 * Agora com suporte a leitura de PDF e análise via IA
 */

import axios from 'axios';
import { logInfo, logError, logWarn } from '../core/logger.ts';
import { aiResilienceNexus } from './ai-resilience-nexus.ts';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TSE_API_BASE = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1';

export interface GovernmentPlanPromise {
  text: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
  page?: number;
  confidence: number;
}

export class GovernmentPlanExtractorService {
  /**
   * Busca e extrai promessas do Plano de Governo oficial no TSE
   */
  async extractFromTSE(
    politicianName: string, 
    state: string = 'BR', 
    year: number = 2022
  ): Promise<GovernmentPlanPromise[]> {
    logInfo(`[GovPlan] Buscando Plano de Governo para: ${politicianName} (${year})`);

    try {
      // 1. Buscar candidato no TSE
      const candidate = await this.findCandidate(politicianName, state, year);
      if (!candidate) {
        logWarn(`[GovPlan] Candidato não encontrado no TSE: ${politicianName}`);
        return [];
      }

      // 2. Buscar arquivo do Plano de Governo
      const planUrl = await this.findPlanFile(candidate.id, state, year);
      if (!planUrl) {
        logWarn(`[GovPlan] Plano de Governo não encontrado para: ${politicianName}`);
        return [];
      }

      logInfo(`[GovPlan] Plano de Governo encontrado: ${planUrl}`);

      // 3. Baixar e processar PDF
      const pdfText = await this.downloadAndExtractPDF(planUrl, candidate.name);
      if (!pdfText) {
        logWarn(`[GovPlan] Não foi possível extrair texto do PDF`);
        return [];
      }

      logInfo(`[GovPlan] PDF extraído com sucesso (${pdfText.length} caracteres)`);

      // 4. Extrair promessas usando IA
      const promises = await this.extractPromisesFromText(pdfText, politicianName, planUrl);
      
      logInfo(`[GovPlan] ${promises.length} promessas extraídas do Plano de Governo`);
      return promises;

    } catch (error: any) {
      logError(`[GovPlan] Erro ao processar TSE para ${politicianName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Busca o candidato no TSE
   */
  private async findCandidate(name: string, state: string, year: number): Promise<any> {
    try {
      // Ajustar cargo baseado no ano
      const cargo = year === 2022 ? '1' : '1'; // 1 = Presidente, 3 = Governador, 6 = Senador, etc
      
      const searchUrl = `${TSE_API_BASE}/candidato/listar/2022/${state}/2040602022/1/candidatos`;
      const response = await axios.get(searchUrl, { timeout: 15000 });
      
      const candidates = response.data?.candidatos || [];
      const candidate = candidates.find((c: any) => 
        c.nomeCompleto?.toLowerCase().includes(name.toLowerCase()) || 
        c.nomeUrna?.toLowerCase().includes(name.toLowerCase())
      );

      return candidate || null;
    } catch (error: any) {
      logError(`[GovPlan] Erro ao buscar candidato: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca o arquivo do Plano de Governo
   */
  private async findPlanFile(candidateId: string, state: string, year: number): Promise<string | null> {
    try {
      const detailUrl = `${TSE_API_BASE}/candidato/buscar/2022/${state}/2040602022/candidato/${candidateId}`;
      const response = await axios.get(detailUrl, { timeout: 15000 });
      
      const files = response.data?.arquivos || [];
      
      // Tipo 5 = Plano de Governo
      const planFile = files.find((f: any) => f.codTipo === '5' || f.codTipo === 5);
      
      if (!planFile) return null;

      // Construir URL do arquivo
      return `${TSE_API_BASE}/candidato/buscar/2022/${state}/2040602022/arquivo/${candidateId}/${planFile.id}`;
    } catch (error: any) {
      logError(`[GovPlan] Erro ao buscar arquivo: ${error.message}`);
      return null;
    }
  }

  /**
   * Baixa o PDF e extrai o texto usando pdftotext
   */
  private async downloadAndExtractPDF(url: string, candidateName: string): Promise<string | null> {
    const tmpDir = '/tmp/seth_pdfs';
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfPath = path.join(tmpDir, `${sanitizedName}.pdf`);
    const txtPath = path.join(tmpDir, `${sanitizedName}.txt`);

    try {
      // Criar diretório temporário
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Baixar PDF
      logInfo(`[GovPlan] Baixando PDF: ${url}`);
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 30000 
      });

      fs.writeFileSync(pdfPath, response.data);
      logInfo(`[GovPlan] PDF salvo em: ${pdfPath}`);

      // Extrair texto usando pdftotext (poppler-utils)
      await execAsync(`pdftotext "${pdfPath}" "${txtPath}"`);
      
      if (!fs.existsSync(txtPath)) {
        logWarn(`[GovPlan] Arquivo de texto não foi gerado`);
        return null;
      }

      const text = fs.readFileSync(txtPath, 'utf-8');
      
      // Limpar arquivos temporários
      fs.unlinkSync(pdfPath);
      fs.unlinkSync(txtPath);

      return text;

    } catch (error: any) {
      logError(`[GovPlan] Erro ao processar PDF: ${error.message}`);
      
      // Limpar em caso de erro
      try {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
      } catch {}

      return null;
    }
  }

  /**
   * Extrai promessas do texto usando IA
   */
  private async extractPromisesFromText(
    text: string, 
    politicianName: string, 
    sourceUrl: string
  ): Promise<GovernmentPlanPromise[]> {
    try {
      // Limitar tamanho do texto (primeiras 10.000 caracteres)
      const limitedText = text.substring(0, 10000);

      const prompt = `
VOCÊ É UM EXTRATOR DE PROMESSAS POLÍTICAS DO SETH VII.

DOCUMENTO: Plano de Governo oficial de ${politicianName} registrado no TSE.

TEXTO DO PLANO:
${limitedText}

INSTRUÇÕES:
1. Extraia TODAS as promessas, compromissos e propostas concretas do texto
2. Ignore textos genéricos como "melhorar o país" - foque em propostas ESPECÍFICAS
3. Classifique cada promessa por categoria (EDUCAÇÃO, SAÚDE, ECONOMIA, etc)
4. Atribua prioridade (high/medium/low) baseado na ênfase no texto
5. Atribua confiança (0-100) baseado na clareza da promessa

RESPONDA APENAS JSON:
{
  "promises": [
    {
      "text": "texto exato da promessa",
      "category": "CATEGORIA",
      "priority": "high|medium|low",
      "confidence": 0-100
    }
  ]
}`;

      const response = await aiResilienceNexus.chat(prompt);
      
      // Tentar parsear JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logWarn(`[GovPlan] Resposta da IA não contém JSON válido`);
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const promises = parsed.promises || [];

      return promises.map((p: any) => ({
        text: p.text,
        category: p.category || 'GERAL',
        priority: p.priority || 'medium',
        source: sourceUrl,
        confidence: p.confidence || 50
      }));

    } catch (error: any) {
      logError(`[GovPlan] Erro ao extrair promessas via IA: ${error.message}`);
      return [];
    }
  }
}

export const governmentPlanExtractorService = new GovernmentPlanExtractorService();
