
import { Request, Response } from 'express';
import { dossierService } from '../services/dossier.service.ts';
import { logInfo, logError } from '../core/logger.ts';

export class DossierController {
  /**
   * GET /api/dossier/:politician
   * Retorna o dossiê consolidado de um político
   */
  async getDossier(req: Request, res: Response) {
    const { politician } = req.params;
    
    if (!politician) {
      return res.status(400).json({ error: 'Nome do político é obrigatório' });
    }

    try {
      logInfo(`[DossierController] Requisição de dossiê para: ${politician}`);
      const dossier = await dossierService.generateDossier(politician);

      if (!dossier) {
        return res.status(404).json({ 
          error: 'Dossiê não encontrado', 
          message: 'Não há análises suficientes para gerar um dossiê para este político.' 
        });
      }

      return res.json(dossier);
    } catch (error) {
      logError(`[DossierController] Erro ao processar dossiê para ${politician}`, error as Error);
      return res.status(500).json({ error: 'Erro interno ao gerar dossiê' });
    }
  }
}

export const dossierController = new DossierController();
