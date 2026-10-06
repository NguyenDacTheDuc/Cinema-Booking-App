import { Router } from 'express';
import * as showtimeController from './showtimeController';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import { validate } from '../../middlewares/validate';
import { createShowtimeSchema, updateShowtimeSchema } from './showtimeValidator';

const router = Router();

router.get('/', showtimeController.getShowtimes);
router.get('/:id', showtimeController.getShowtimeById);
router.post('/', authenticate, requireAdmin, validate(createShowtimeSchema), showtimeController.createShowtime);
router.put('/:id', authenticate, requireAdmin, validate(updateShowtimeSchema), showtimeController.updateShowtime);
router.delete('/:id', authenticate, requireAdmin, showtimeController.deleteShowtime);

export default router;
