import { Router } from 'express';
import { getSupabase } from '../core/database.js';
import { logError, logInfo } from '../core/logger.js';
import { nanoid } from 'nanoid';

const router = Router();

/**
 * POST /api/audit/contribute
 * Recebe uma contribuição de auditoria cidadã
 */
router.post('/contribute', async (req, res) => {
  try {
    const { promiseId, type, suggestedUrl, description } = req.body;
    const userId = (req as any).userId || null;
    const supabase = getSupabase();

    if (!promiseId || !type) {
      return res.status(400).json({ error: 'Promise ID e Tipo são obrigatórios' });
    }

    const contributionId = nanoid();
    const { error } = await supabase.from('audit_contributions').insert([{
      id: contributionId,
      promise_id: promiseId,
      user_id: userId,
      type,
      suggested_url: suggestedUrl,
      description,
      status: 'pending'
    }]);

    if (error) throw error;

    logInfo(`[Audit] Nova contribuição recebida: ${contributionId} para a promessa ${promiseId}`);

    // Lógica de Inteligência Coletiva: 
    // Se houver mais de 5 reports para a mesma promessa, poderíamos disparar um alerta ou re-análise automática.
    // Por enquanto, apenas registramos para auditoria manual/futura.

    return res.status(201).json({ id: contributionId, message: 'Contribuição registrada com sucesso' });
  } catch (error) {
    logError('Erro ao registrar contribuição de auditoria', error as Error);
    return res.status(500).json({ error: 'Erro interno ao processar contribuição' });
  }
});

export default router;
