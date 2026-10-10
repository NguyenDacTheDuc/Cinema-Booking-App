import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { AdminBooking, Booking, SeatHold, SeatMapItem } from '../types/booking';

// Admin: toàn bộ đơn đặt vé, mới nhất trước
export async function getAllBookings(): Promise<AdminBooking[]> {
  const res = await axiosClient.get<ApiResponse<AdminBooking[]>>('/bookings');
  return res.data.data;
}

// Khách hàng: các đơn đặt vé của chính mình
export async function getMyBookings(): Promise<Booking[]> {
  const res = await axiosClient.get<ApiResponse<Booking[]>>('/bookings/me');
  return res.data.data;
}

// Sơ đồ ghế của 1 suất chiếu. Có đăng nhập thì backend đánh dấu thêm ghế của mình (isMine)
export async function getSeatMap(showtimeId: number): Promise<SeatMapItem[]> {
  const res = await axiosClient.get<ApiResponse<SeatMapItem[]>>(`/showtimes/${showtimeId}/seats`);
  return res.data.data;
}

// Giữ ghế: gửi toàn bộ danh sách ghế đang chọn (0-8 ghế, rỗng = nhả hết)
export async function lockSeats(showtimeId: number, seatIds: number[]): Promise<SeatHold> {
  const res = await axiosClient.post<ApiResponse<SeatHold>>(`/showtimes/${showtimeId}/seats/lock`, { seatIds });
  return res.data.data;
}
