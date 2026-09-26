import { Router } from 'express';
import * as seatTypeController from './seatTypeController';
import { validate } from '../../middlewares/validate';
import { requireAdmin } from '../../middlewares/authorization';
import { authenticate } from '../../middlewares/authenticate';
import { createSeatTypeSchema, updateSeatTypeSchema } from './seatTypeValidator';

const router = Router();

router.get('/', seatTypeController.getSeatTypes);
router.post('/', authenticate, requireAdmin, validate(createSeatTypeSchema), seatTypeController.createSeatType);
router.put('/:id', authenticate, requireAdmin, validate(updateSeatTypeSchema), seatTypeController.updateSeatType);
router.delete('/:id', authenticate, requireAdmin, seatTypeController.deleteSeatType);

export default router;
