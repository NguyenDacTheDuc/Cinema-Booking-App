import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { AdminBooking } from '../types/booking';

// Admin: toàn bộ đơn đặt vé, mới nhất trước
export async function getAllBookings(): Promise<AdminBooking[]> {
  const res = await axiosClient.get<ApiResponse<AdminBooking[]>>('/bookings');
  return res.data.data;
}
