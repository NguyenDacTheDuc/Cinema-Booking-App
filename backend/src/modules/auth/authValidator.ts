import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  gender: z.string().min(1, 'Vui lòng chọn giới tính'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  dateOfBirth: z.coerce.date('Ngày sinh không hợp lệ'),
});

export const loginSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const updateProfileSchema = z.object({
  avatar: z.string().optional(),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').optional(),
  gender: z.string().min(1, 'Giới tính không hợp lệ').optional(),
  dateOfBirth: z.coerce.date('Ngày sinh không hợp lệ').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
