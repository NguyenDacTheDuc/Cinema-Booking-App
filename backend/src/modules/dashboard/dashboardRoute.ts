import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import * as dashboardController from './dashboardController';

const router = Router();

router.get('/', authenticate, requireAdmin, dashboardController.getDashboard);

export default router;
