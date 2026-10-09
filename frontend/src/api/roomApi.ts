import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { CreateRoomInput, Room, Seat, UpdateRoomInput } from '../types/cinema';

// ======================= Phòng =======================

// Admin: tất cả phòng của 1 rạp (kể cả ngừng hoạt động), kèm số ghế
export async function getRoomsByCinema(cinemaId: number): Promise<Room[]> {
  const res = await axiosClient.get<ApiResponse<Room[]>>(`/admin/cinemas/${cinemaId}/rooms`);
  return res.data.data;
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const res = await axiosClient.post<ApiResponse<Room>>('/rooms', input);
  return res.data.data;
}

export async function updateRoom(id: number, input: UpdateRoomInput): Promise<Room> {
  const res = await axiosClient.put<ApiResponse<Room>>(`/rooms/${id}`, input);
  return res.data.data;
}

export async function deleteRoom(id: number): Promise<void> {
  await axiosClient.delete(`/rooms/${id}`);
}

// ======================= Ghế =======================

// Admin: sơ đồ ghế của 1 phòng (đã sắp theo hàng rồi theo số ghế)
export async function getSeatsByRoom(roomId: number): Promise<Seat[]> {
  const res = await axiosClient.get<ApiResponse<Seat[]>>(`/rooms/${roomId}/seats`);
  return res.data.data;
}

// Admin: đổi loại ghế
export async function changeSeatType(seatId: number, seatTypeId: number): Promise<Seat> {
  const res = await axiosClient.put<ApiResponse<Seat>>(`/seats/${seatId}`, { seatTypeId });
  return res.data.data;
}
