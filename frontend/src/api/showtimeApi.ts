import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { CreateShowtimeInput, Showtime, ShowtimeFilter, UpdateShowtimeInput } from '../types/showtime';

export async function getShowtimes(filter: ShowtimeFilter = {}): Promise<Showtime[]> {
  const res = await axiosClient.get<ApiResponse<Showtime[]>>('/showtimes', { params: filter });
  return res.data.data;
}

// ======================= Admin =======================

export async function createShowtime(input: CreateShowtimeInput): Promise<Showtime> {
  const res = await axiosClient.post<ApiResponse<Showtime>>('/showtimes', input);
  return res.data.data;
}

export async function updateShowtime(id: number, input: UpdateShowtimeInput): Promise<Showtime> {
  const res = await axiosClient.put<ApiResponse<Showtime>>(`/showtimes/${id}`, input);
  return res.data.data;
}

export async function deleteShowtime(id: number): Promise<void> {
  await axiosClient.delete(`/showtimes/${id}`);
}

export async function getShowtimeById(id: number): Promise<Showtime> {
  const res = await axiosClient.get<ApiResponse<Showtime>>(`/showtimes/${id}`);
  return res.data.data;
}
