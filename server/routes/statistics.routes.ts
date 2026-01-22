import { Router } from 'express';
import { statisticsController } from '../controllers/statistics.controller.js';

const router = Router();

router.get('/', statisticsController.getGlobalStats);

export default router;
