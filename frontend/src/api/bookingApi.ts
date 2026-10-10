import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { AdminBooking, Booking } from '../types/booking';

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
