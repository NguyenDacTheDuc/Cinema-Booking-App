import { Router } from 'express';
import * as cinemaController from './cinemaController';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import { validate } from '../../middlewares/validate';
import { createCinemaSchema, updateCinemaSchema } from './cinemaValidator';

const router = Router();

router.get('/cinemas', cinemaController.getActiveCinemas);
router.get('/cinemas/:id', cinemaController.getCinemaById);
router.get('/admin/cinemas', authenticate, requireAdmin, cinemaController.getAllCinemas);
router.post('/cinemas', authenticate, requireAdmin, validate(createCinemaSchema), cinemaController.createCinema);
router.put('/cinemas/:id', authenticate, requireAdmin, validate(updateCinemaSchema), cinemaController.updateCinema);
router.delete('/cinemas/:id', authenticate, requireAdmin, cinemaController.deleteCinema);

export default router;
