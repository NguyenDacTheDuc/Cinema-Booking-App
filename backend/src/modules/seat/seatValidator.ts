import { z } from 'zod';

export const updateSeatSchema = z.object({
  seatTypeId: z.int('Id loại ghế phải là số nguyên').positive('Id loại ghế không hợp lệ'),
});

export type UpdateSeatInput = z.infer<typeof updateSeatSchema>;
