import { Router } from 'express';
import * as genreController from './genreController';
import { authenticate } from '../../middlewares/authenticate';
import { requireAdmin } from '../../middlewares/authorization';
import { validate } from '../../middlewares/validate';
import { createGenreSchema, updateGenreSchema } from './genreValidator';

// Router này được gắn tại /api trong app.ts (vì có cả route /admin/...),
// nên mỗi route ghi đường dẫn đầy đủ.
const router = Router();

router.get('/genres', genreController.getActiveGenres);
router.get('/admin/genres', authenticate, requireAdmin, genreController.getAllGenres);
router.post('/genres', authenticate, requireAdmin, validate(createGenreSchema), genreController.createGenre);
router.put('/genres/:id', authenticate, requireAdmin, validate(updateGenreSchema), genreController.updateGenre);
router.delete('/genres/:id', authenticate, requireAdmin, genreController.deleteGenre);

export default router;
