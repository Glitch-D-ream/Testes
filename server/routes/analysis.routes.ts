import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller.ts';
import { optionalAuthMiddleware } from '../core/middleware.ts';
import rateLimit from 'express-rate-limit';

const router = Router();

const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: (req: any) => {
    return req.user ? 50 : 10;
  },
  message: 'Muitas análises. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', optionalAuthMiddleware, analysisLimiter, analysisController.create);
router.get('/:id', optionalAuthMiddleware, analysisController.getById);
router.get('/:id/pdf', optionalAuthMiddleware, analysisController.exportPDF);
router.get('/:id/image', optionalAuthMiddleware, analysisController.exportImage);
router.get('/', optionalAuthMiddleware, analysisController.list);

export default router;
