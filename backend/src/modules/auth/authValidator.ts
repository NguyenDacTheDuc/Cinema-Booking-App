import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string().min(8, 'Vui lòng nhập tên đầy đủ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  dateOfBirth: z.iso.date('Ngày sinh không hợp lệ (định dạng YYYY-MM-DD)'),
});

export const loginSchema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const updateProfileSchema = z.object({
  avatar: z.string().optional(),
  gender: z.string().min(1, 'Giới tính không hợp lệ').optional(),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').optional(),
  dateOfBirth: z.iso.date('Ngày sinh không hợp lệ (định dạng YYYY-MM-DD)').optional(),
  fullName: z.string().min(8, 'Vui lòng nhập tên đầy đủ').optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
