import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { SeatType, SeatTypeInput } from '../types/seatType';

export async function getSeatTypes(): Promise<SeatType[]> {
  const res = await axiosClient.get<ApiResponse<SeatType[]>>('/seat-types');
  return res.data.data;
}

export async function createSeatType(input: SeatTypeInput): Promise<SeatType> {
  const res = await axiosClient.post<ApiResponse<SeatType>>('/seat-types', input);
  return res.data.data;
}

export async function updateSeatType(id: number, input: SeatTypeInput): Promise<SeatType> {
  const res = await axiosClient.put<ApiResponse<SeatType>>(`/seat-types/${id}`, input);
  return res.data.data;
}

export async function deleteSeatType(id: number): Promise<void> {
  await axiosClient.delete(`/seat-types/${id}`);
}
