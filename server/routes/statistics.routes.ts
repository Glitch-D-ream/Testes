import { Router } from 'express';
import { statisticsController } from '../controllers/statistics.controller.ts';

const router = Router();

router.get('/', statisticsController.getGlobalStats);

export default router;
