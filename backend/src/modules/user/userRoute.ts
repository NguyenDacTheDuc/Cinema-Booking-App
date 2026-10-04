import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import { validate } from '../../middlewares/validate';
import { updateUserStatusSchema } from './userValidator';
import * as userController from './userController';

const router = Router();

router.get('/', authenticate, requireAdmin, userController.getAllUsers);
router.put('/:id/status', authenticate, requireAdmin, validate(updateUserStatusSchema), userController.updateUser);

export default router;
