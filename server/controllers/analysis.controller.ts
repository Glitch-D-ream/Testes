import { Request, Response } from 'express';
import { analysisService } from '../services/analysis.service.js';
import { exportService } from '../services/export.service.js';
import { validate, AnalysisSchema } from '../core/schemas.js';
import { logInfo, logError } from '../core/logger.js';
import { createAuditLog } from '../core/database.js';
import { nanoid } from 'nanoid';

export class AnalysisController {
  async create(req: Request, res: Response) {
    try {
      const validation = validate(AnalysisSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const { text, author, category } = validation.data;
      const userId = req.userId || null;

      const result = await analysisService.createAnalysis(userId, text, author, category);

      // Log de auditoria
      await createAuditLog(
        nanoid(),
        userId,
        'ANALYSIS_CREATED',
        'analysis',
        result.id,
        req.ip || null,
        req.get('user-agent') || null
      );

      logInfo('Análise criada', { analysisId: result.id, userId, promisesCount: result.promisesCount });

      res.status(201).json(result);
    } catch (error) {
      logError('Erro ao criar análise', error as Error);
      res.status(500).json({ error: 'Erro ao criar análise' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const analysis = await analysisService.getAnalysisById(id);

      if (!analysis) {
        return res.status(404).json({ error: 'Análise não encontrada' });
      }

      res.json(analysis);
    } catch (error) {
      logError('Erro ao obter análise', error as Error);
      res.status(500).json({ error: 'Erro ao obter análise' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await analysisService.listAnalyses(limit, offset);

      res.json({
        ...result,
        limit,
        offset,
      });
    } catch (error) {
      logError('Erro ao listar análises', error as Error);
      res.status(500).json({ error: 'Erro ao listar análises' });
    }
  }

  async exportPDF(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const pdfBuffer = await exportService.generateAnalysisPDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="analise-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      logError('Erro ao exportar PDF', error as Error);
      res.status(500).json({ error: 'Erro ao gerar relatório PDF' });
    }
  }
}

export const analysisController = new AnalysisController();
