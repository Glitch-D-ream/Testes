import { Router, Request, Response } from 'express';
import { telegramWebhookService } from '../services/telegram-webhook.service.js';
import { logInfo, logError } from '../core/logger.js';

const router = Router();

/**
 * POST /api/telegram/webhook
 * Recebe updates do Telegram via webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;

    if (!update || !update.update_id) {
      return res.status(400).json({ error: 'Invalid update' });
    }

    // Processar update de forma assíncrona
    telegramWebhookService.handleUpdate(update).catch(error => {
      logError('Erro ao processar update do Telegram', error);
    });

    // Responder imediatamente ao Telegram
    res.status(200).json({ ok: true });
  } catch (error) {
    logError('Erro no endpoint de webhook do Telegram', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/telegram/set-webhook
 * Configura o webhook do Telegram (admin only)
 */
router.post('/set-webhook', async (req: Request, res: Response) => {
  try {
    if (!telegramWebhookService.isConfigured()) {
      return res.status(400).json({ 
        error: 'Bot não configurado',
        message: 'TELEGRAM_BOT_TOKEN ou WEBHOOK_DOMAIN não definidos'
      });
    }

    const success = await telegramWebhookService.setWebhook();
    
    if (success) {
      const info = await telegramWebhookService.getWebhookInfo();
      res.json({ 
        success: true, 
        message: 'Webhook configurado com sucesso',
        webhookInfo: info
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Falha ao configurar webhook' 
      });
    }
  } catch (error) {
    logError('Erro ao configurar webhook', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/telegram/webhook
 * Remove o webhook do Telegram (admin only)
 */
router.delete('/webhook', async (req: Request, res: Response) => {
  try {
    const success = await telegramWebhookService.deleteWebhook();
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Webhook removido com sucesso' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Falha ao remover webhook' 
      });
    }
  } catch (error) {
    logError('Erro ao remover webhook', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/telegram/webhook-info
 * Obtém informações sobre o webhook atual
 */
router.get('/webhook-info', async (req: Request, res: Response) => {
  try {
    if (!telegramWebhookService.isConfigured()) {
      return res.status(400).json({ 
        error: 'Bot não configurado',
        message: 'TELEGRAM_BOT_TOKEN não definido'
      });
    }

    const info = await telegramWebhookService.getWebhookInfo();
    
    res.json({ 
      configured: telegramWebhookService.isWebhookConfigured(),
      webhookInfo: info
    });
  } catch (error) {
    logError('Erro ao obter info do webhook', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/telegram/status
 * Verifica o status do bot
 */
router.get('/status', (req: Request, res: Response) => {
  const isConfigured = telegramWebhookService.isConfigured();
  const isWebhookSet = telegramWebhookService.isWebhookConfigured();

  res.json({
    configured: isConfigured,
    webhookSet: isWebhookSet,
    hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
    hasDomain: !!process.env.WEBHOOK_DOMAIN
  });
});

export default router;
