import { z } from 'zod';

export const createGenreSchema = z.object({
  name: z.string().min(1, 'Tên thể loại không được để trống'),
});

export const updateGenreSchema = z.object({
  name: z.string().min(1, 'Tên thể loại không được để trống').optional(),
  status: z.enum(['active', 'inactive'], 'Trạng thái không hợp lệ').optional(),
});

export type CreateGenreInput = z.infer<typeof createGenreSchema>;
export type UpdateGenreInput = z.infer<typeof updateGenreSchema>;
