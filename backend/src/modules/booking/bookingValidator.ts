import { z } from 'zod';
import { MAX_SEATS_PER_BOOKING } from '../../config/constants';

export const lockSeatsSchema = z.object({
  seatIds: z
    .array(z.int('Id ghế phải là số nguyên').positive('Id ghế không hợp lệ'), 'Danh sách ghế không hợp lệ')
    .min(1, 'Vui lòng chọn ít nhất 1 ghế')
    .max(MAX_SEATS_PER_BOOKING, `Mỗi lần đặt chỉ được chọn tối đa ${MAX_SEATS_PER_BOOKING} ghế`),
});

export const createBookingSchema = z.object({
  showtimeId: z.int('Id suất chiếu phải là số nguyên').positive('Id suất chiếu không hợp lệ'),
});

export type LockSeatsInput = z.infer<typeof lockSeatsSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
