import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { optionalAuthMiddleware } from '../core/middleware.js';

const router = Router();

/**
 * GET /api/search?q=termo
 * Busca global em políticos e promessas no banco de dados
 */
router.get('/', searchController.searchPoliticians);

/**
 * POST /api/search/auto-analyze
 * Busca na web e analisa automaticamente um político
 */
router.post('/auto-analyze', optionalAuthMiddleware, searchController.autoAnalyze);

export default router;
