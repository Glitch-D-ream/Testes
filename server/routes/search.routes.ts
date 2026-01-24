import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';

const router = Router();

/**
 * GET /api/search?q=termo
 * Busca global em políticos e promessas
 */
router.get('/', searchController.searchPoliticians);

export default router;
