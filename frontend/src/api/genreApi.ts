import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { AdminGenre, CreateGenreInput, UpdateGenreInput } from '../types/genre';

// Admin: tất cả thể loại, kể cả đang ngừng dùng
export async function getAllGenres(): Promise<AdminGenre[]> {
  const res = await axiosClient.get<ApiResponse<AdminGenre[]>>('/admin/genres');
  return res.data.data;
}

export async function createGenre(input: CreateGenreInput): Promise<AdminGenre> {
  const res = await axiosClient.post<ApiResponse<AdminGenre>>('/genres', input);
  return res.data.data;
}

export async function updateGenre(id: number, input: UpdateGenreInput): Promise<AdminGenre> {
  const res = await axiosClient.put<ApiResponse<AdminGenre>>(`/genres/${id}`, input);
  return res.data.data;
}

export async function deleteGenre(id: number): Promise<void> {
  await axiosClient.delete(`/genres/${id}`);
}
