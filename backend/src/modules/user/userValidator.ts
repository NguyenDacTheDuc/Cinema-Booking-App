import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive'], 'Trạng thái không hợp lệ'),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
