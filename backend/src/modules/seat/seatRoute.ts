import { Router } from 'express';
import * as seatController from './seatController';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import { validate } from '../../middlewares/validate';
import { updateSeatSchema } from './seatValidator';

const router = Router();

router.get('/rooms/:roomId/seats', authenticate, requireAdmin, seatController.getSeatsByRoom);
router.put('/seats/:id', authenticate, requireAdmin, validate(updateSeatSchema), seatController.updateSeat);

export default router;
