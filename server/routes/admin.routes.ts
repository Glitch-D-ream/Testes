import { Router, Request, Response } from 'express';
import { syncAllPublicData, getSyncStatus } from '../jobs/sync-public-data.ts';
import { logInfo, logError } from '../core/logger.ts';
import { authMiddleware } from '../core/middleware.ts';

const router = Router();

/**
 * POST /api/admin/sync
 * Dispara a sincronização manual de dados públicos (TSE, Portal da Transparência, SICONFI)
 */
router.post('/sync', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Apenas administradores podem disparar a sincronização
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
      return;
    }

    logInfo('[Admin] Sincronização manual disparada por: ' + (req as any).userId);
    
    // Executar em background para não travar a requisição
    syncAllPublicData().catch(err => logError('[Admin] Erro na sincronização em background', err));

    res.json({ 
      message: 'Sincronização iniciada em segundo plano.',
      status: 'syncing'
    });
  } catch (error) {
    logError('[Admin] Erro ao disparar sincronização', error as Error);
    res.status(500).json({ error: 'Erro interno ao disparar sincronização' });
  }
});

/**
 * GET /api/admin/sync/status
 * Obtém o status da última sincronização
 */
router.get('/sync/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }

    const status = getSyncStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter status' });
  }
});

export default router;
