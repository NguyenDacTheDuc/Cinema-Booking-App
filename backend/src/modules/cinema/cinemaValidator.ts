import { z } from 'zod';

export const createCinemaSchema = z.object({
  name: z.string().min(1, 'Tên rạp không được bỏ trống'),
  address: z.string().min(1, 'Tên địa chỉ rạp không được bỏ trống'),
});

export const updateCinemaSchema = z.object({
  name: z.string().min(1, 'Tên rạp không được bỏ trống').optional(),
  address: z.string().min(1, 'Địa chỉ rạp không được bỏ trống').optional(),
  status: z.enum(['active', 'inactive'], 'Trạng thái không hợp lệ').optional(),
});

export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
export type UpdateCinemaInput = z.infer<typeof updateCinemaSchema>;
