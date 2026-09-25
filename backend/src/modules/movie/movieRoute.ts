import { Router } from 'express';
import * as movieController from './movieController';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import { validate } from '../../middlewares/validate';
import { createMovieSchema, updateMovieSchema } from './movieValidator';

// Router này được gắn tại /api/movies trong app.ts
const router = Router();

router.get('/', movieController.getMovies);
router.get('/:id', movieController.getMovieById);
router.post('/', authenticate, requireAdmin, validate(createMovieSchema), movieController.createMovie);
router.put('/:id', authenticate, requireAdmin, validate(updateMovieSchema), movieController.updateMovie);
router.delete('/:id', authenticate, requireAdmin, movieController.deleteMovie);

export default router;
