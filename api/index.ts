import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  const { url } = req;
  
  if (url?.includes('/health')) {
    return res.status(200).json({ status: 'ok', source: 'manual_handler' });
  }
  
  if (url?.includes('/telegram/status')) {
    return res.status(200).json({ 
      bot_token: process.env.TELEGRAM_BOT_TOKEN ? 'Configured' : 'Missing',
      webhook: process.env.WEBHOOK_DOMAIN || 'Missing'
    });
  }

  return res.status(404).json({ error: 'Route not found in manual handler', url });
}
