import { z } from 'zod';

export const createMovieSchema = z.object({
  title: z.string().min(1, 'Tên phim không được bỏ trống'),
  description: z.string().min(10, 'Mô tả phim phải có ít nhất 10 ký tự'),
  duration: z.int('Thời lượng phải là số nguyên').min(15, 'Thời lượng phim không được ít hơn 15 phút').max(240, 'Thời lượng phim không được nhiều hơn 4 tiếng'),
  language: z.string().min(1, 'Ngôn ngữ không được bỏ trống'),
  director: z.string().min(1, 'Tên đạo diễn không được bỏ trống'),
  castList: z.string().min(1, 'Dàn diễn viên không được bỏ trống'),
  ageRating: z.string().min(1, 'Độ tuổi xem phim không được bỏ trống'),
  posterUrl: z.string().min(1, 'Poster phim không được bỏ trống'),
  trailerUrl: z.string().min(1, 'Trailer phim không được bỏ trống'),
  genreIds: z.array(z.int('Id thể loại không hợp lệ').positive('Id thể loại không hợp lệ')).min(1, 'Phim phải có ít nhất 1 thể loại'),
  releaseDate: z.coerce.date('Ngày khởi chiếu không hợp lệ'),
  endDate: z.coerce.date('Ngày kết thúc chiếu không hợp lệ'),
  status: z.enum(['coming_soon', 'now_showing'], 'Trạng thái không hợp lệ').optional(),
});

export const updateMovieSchema = createMovieSchema.partial();

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
