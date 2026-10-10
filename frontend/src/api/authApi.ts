import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { AuthResult, ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput, User } from '../types/auth';

export async function login(input: LoginInput): Promise<AuthResult> {
  const res = await axiosClient.post<ApiResponse<AuthResult>>('/auth/login', input);
  return res.data.data;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const res = await axiosClient.post<ApiResponse<AuthResult>>('/auth/register', input);
  return res.data.data;
}

// Lấy thông tin người dùng đang đăng nhập (dựa vào token gắn sẵn trong axiosClient)
export async function getMe(): Promise<User> {
  const res = await axiosClient.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}

// Sửa hồ sơ của chính mình, trả về thông tin mới
export async function updateMe(input: UpdateProfileInput): Promise<User> {
  const res = await axiosClient.put<ApiResponse<User>>('/auth/me', input);
  return res.data.data;
}

// Đổi mật khẩu (API backend sẽ bổ sung sau)
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await axiosClient.put('/auth/password', input);
}
