import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { DashboardData } from '../types/dashboard';

// Admin: toàn bộ số liệu cho trang Tổng quan
export async function getDashboard(): Promise<DashboardData> {
  const res = await axiosClient.get<ApiResponse<DashboardData>>('/dashboard');
  return res.data.data;
}
