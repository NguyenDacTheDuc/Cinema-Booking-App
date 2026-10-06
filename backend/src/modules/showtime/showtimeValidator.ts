import { z } from 'zod';

export const createShowtimeSchema = z.object({
  movieId: z.int('Id phim phải là số nguyên').positive('Id phim không hợp lệ'),
  roomId: z.int('Id phòng phải là số nguyên').positive('Id phòng không hợp lệ'),
  showDate: z.iso.date('Ngày chiếu không hợp lệ (định dạng YYYY-MM-DD, ví dụ 2026-10-10)'),
  startTime: z.string('Giờ bắt đầu không được bỏ trống').regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ bắt đầu không hợp lệ (định dạng HH:mm, ví dụ 19:30)'),
});

export const updateShowtimeSchema = z.object({
  showDate: z.iso.date('Ngày chiếu không hợp lệ (định dạng YYYY-MM-DD, ví dụ 2026-10-10)').optional(),
  startTime: z
    .string('Giờ bắt đầu không được bỏ trống')
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ bắt đầu không hợp lệ (định dạng HH:mm, ví dụ 19:30)')
    .optional(),
});

export type CreateShowtimeInput = z.infer<typeof createShowtimeSchema>;
export type UpdateShowtimeInput = z.infer<typeof updateShowtimeSchema>;
