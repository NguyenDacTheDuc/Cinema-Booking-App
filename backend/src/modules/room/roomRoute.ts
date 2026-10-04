import { Router } from 'express';
import * as roomController from './roomController';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import { validate } from '../../middlewares/validate';
import { createRoomSchema, updateRoomSchema } from './roomValidator';

const router = Router();

router.get('/cinemas/:cinemaId/rooms', roomController.getActiveRooms);
router.get('/admin/cinemas/:cinemaId/rooms', authenticate, requireAdmin, roomController.getAllRooms);
router.post('/rooms', authenticate, requireAdmin, validate(createRoomSchema), roomController.createRoom);
router.put('/rooms/:id', authenticate, requireAdmin, validate(updateRoomSchema), roomController.updateRoom);
router.delete('/rooms/:id', authenticate, requireAdmin, roomController.deleteRoom);

export default router;
