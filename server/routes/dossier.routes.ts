
import { Router } from 'express';
import { dossierController } from '../controllers/dossier.controller.ts';
import { optionalAuthMiddleware } from '../core/middleware.ts';
import rateLimit from 'express-rate-limit';

const router = Router();

const dossierLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Limite de 20 dossiês por janela
  message: 'Muitas requisições de dossiê. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/:politician', optionalAuthMiddleware, dossierLimiter, dossierController.getDossier);

export default router;
