
import { Router } from 'express';
import { searchService } from '../services/search.service.js';
import { importService } from '../services/import.service.js';
import { logError } from '../core/logger.js';

const router = Router();

/**
 * GET /api/search?q=termo
 * Busca global em políticos e promessas
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Termo de busca muito curto' });
    }

    const results = await searchService.globalSearch(query);
    res.json(results);
  } catch (error) {
    logError('Erro na busca global', error as Error);
    res.status(500).json({ error: 'Erro interno ao realizar busca' });
  }
});

/**
 * GET /api/search/politicians?q=nome
 */
router.get('/politicians', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) return res.json([]);

    // 1. Tenta buscar no banco local
    let results = await searchService.searchPoliticians(query);

    // 2. Se não achar nada e o termo parecer um nome, tenta importar da API da Câmara
    if (results.length === 0 && query.length > 3) {
      await importService.importFromCamara(query);
      // Busca novamente após a importação
      results = await searchService.searchPoliticians(query);
    }

    res.json(results);
  } catch (error) {
    logError('Erro na busca de políticos', error as Error);
    res.status(500).json({ error: 'Erro interno ao buscar políticos' });
  }
});

export default router;
