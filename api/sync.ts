import { syncAllPublicData } from '../server/jobs/sync-public-data.js';
import { initializeDatabase } from '../server/core/database.js';
import logger from '../server/core/logger.js';

export default async function handler(req: any, res: any) {
  // Proteção simples para garantir que apenas o Vercel Cron ou Admin chame esta rota
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    logger.info('[Cron] Iniciando sincronização via rota API');
    await initializeDatabase();
    await syncAllPublicData();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Sincronização concluída com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[Cron] Erro durante sincronização:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno' 
    });
  }
}
