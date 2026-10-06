import { z } from 'zod';

export const createRoomSchema = z.object({
  cinemaId: z.int('Id rạp phải là số nguyên').positive('Id rạp không hợp lệ'),
  name: z.string().min(1, 'Tên phòng không được bỏ trống'),
  rows: z.int('Số hàng phải là số nguyên').min(1, 'Số hàng ghế phải là số dương').max(26, 'Số hàng tối đa là 26'),
  columns: z.int('Số ghế mỗi hàng phải là số nguyên').min(1, 'Số ghế mỗi hàng phải là số dương').max(30, 'Mỗi ghế mỗi hàng tối đa 30 ghế'),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1, 'Tên phòng không được bỏ trống').optional(),
  status: z.enum(['active', 'inactive'], 'Trạng thái không hợp lệ').optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
