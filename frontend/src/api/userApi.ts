import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { User, UserStatus } from '../types/auth';

// Admin: danh sách khách hàng (backend đã ẩn tài khoản admin và mật khẩu)
export async function getUsers(): Promise<User[]> {
  const res = await axiosClient.get<ApiResponse<User[]>>('/users');
  return res.data.data;
}

// Admin: khóa (inactive) hoặc mở khóa (active) tài khoản
export async function updateUserStatus(id: number, status: UserStatus): Promise<User> {
  const res = await axiosClient.put<ApiResponse<User>>(`/users/${id}/status`, { status });
  return res.data.data;
}
