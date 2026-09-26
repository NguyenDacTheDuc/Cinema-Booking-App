import { z } from 'zod';

export const createSeatTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại ghế không được bỏ trống'),
  price: z.number('Giá loại ghế phải là số').positive('Giá loại ghế phải là số dương'),
});

export const updateSeatTypeSchema = createSeatTypeSchema.partial();

export type CreateSeatTypeInput = z.infer<typeof createSeatTypeSchema>;
export type UpdateSeatTypeInput = z.infer<typeof updateSeatTypeSchema>;
