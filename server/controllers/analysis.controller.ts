import { Request, Response } from 'express';
import { analysisService } from '../services/analysis.service.ts';
import { exportService } from '../services/export.service.ts';
import { validate, AnalysisSchema } from '../core/schemas.ts';
import { logInfo, logError } from '../core/logger.ts';
import { createAuditLog } from '../core/database.ts';
import { nanoid } from 'nanoid';

export class AnalysisController {
  async create(req: Request, res: Response) {
    try {
      const validation = validate(AnalysisSchema, (req as any).body);
      if (!validation.success) {
        return (res as any).status(400).json({ error: (validation as any).error });
      }

      const { text, author, category } = validation.data;
      const userId = (req as any).userId || null;
      const extraData = (req as any).body.extraData || {};

      const result = await analysisService.createAnalysis(
        userId, 
        text, 
        author || 'Autor Desconhecido', 
        category || 'GERAL',
        extraData
      );

      await createAuditLog(
        nanoid(),
        userId,
        'ANALYSIS_CREATED',
        'analysis',
        result.id,
        (req as any).ip || null,
        (req as any).get ? (req as any).get('user-agent') : null
      );

      logInfo('Análise criada', { analysisId: result.id, userId, promisesCount: result.promisesCount });

      return (res as any).status(201).json(result);
    } catch (error) {
      logError('Erro ao criar análise', error as Error);
      return (res as any).status(500).json({ error: 'Erro ao criar análise' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = (req as any).params;
      const analysis = await analysisService.getAnalysisById(id);

      if (!analysis) {
        return (res as any).status(404).json({ error: 'Análise não encontrada' });
      }

      return (res as any).json(analysis);
    } catch (error) {
      logError('Erro ao obter análise', error as Error);
      return (res as any).status(500).json({ error: 'Erro ao obter análise' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt((req as any).query.limit as string) || 50, 100);
      const offset = parseInt((req as any).query.offset as string) || 0;

      const result = await analysisService.listAnalyses(limit, offset);

      return (res as any).json({
        ...result,
        limit,
        offset,
      });
    } catch (error) {
      logError('Erro ao listar análises', error as Error);
      return (res as any).status(500).json({ error: 'Erro ao listar análises' });
    }
  }

  async exportPDF(req: Request, res: Response) {
    try {
      const { id } = (req as any).params;
      const pdfBuffer = await exportService.generateAnalysisPDF(id);

      (res as any).setHeader('Content-Type', 'application/pdf');
      (res as any).setHeader('Content-Disposition', `attachment; filename="analise-${id}.pdf"`);
      return (res as any).send(pdfBuffer);
    } catch (error) {
      logError('Erro ao exportar PDF', error as Error);
      return (res as any).status(500).json({ error: 'Erro ao gerar relatório PDF' });
    }
  }

  async exportImage(req: Request, res: Response) {
    try {
      const { id } = (req as any).params;
      const imageBuffer = await exportService.generateAnalysisImage(id);

      (res as any).setHeader('Content-Type', 'image/jpeg');
      (res as any).setHeader('Content-Disposition', `inline; filename="analise-${id}.jpg"`);
      return (res as any).send(imageBuffer);
    } catch (error) {
      logError('Erro ao exportar Imagem', error as Error);
      return (res as any).status(500).json({ error: 'Erro ao gerar card de compartilhamento' });
    }
  }
}

export const analysisController = new AnalysisController();
