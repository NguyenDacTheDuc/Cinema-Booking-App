import { Router } from 'express';
import * as authController from './authController';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { registerSchema, loginSchema, updateProfileSchema } from './authValidator';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateMe);

export default router;
