import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { Cinema, CinemaInput } from '../types/cinema';

// Admin: tất cả rạp, kể cả đang ngừng hoạt động
export async function getAllCinemas(): Promise<Cinema[]> {
  const res = await axiosClient.get<ApiResponse<Cinema[]>>('/admin/cinemas');
  return res.data.data;
}

export async function createCinema(input: CinemaInput): Promise<Cinema> {
  const res = await axiosClient.post<ApiResponse<Cinema>>('/cinemas', input);
  return res.data.data;
}

export async function updateCinema(id: number, input: CinemaInput): Promise<Cinema> {
  const res = await axiosClient.put<ApiResponse<Cinema>>(`/cinemas/${id}`, input);
  return res.data.data;
}

export async function deleteCinema(id: number): Promise<void> {
  await axiosClient.delete(`/cinemas/${id}`);
}

export async function getActiveCinemas(): Promise<Cinema[]> {
  const res = await axiosClient.get<ApiResponse<Cinema[]>>('/cinemas');
  return res.data.data;
}
