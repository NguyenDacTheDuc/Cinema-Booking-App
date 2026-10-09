export type BookingStatus = 'pending' | 'confirmed';

// Một vé (ghế) trong đơn đặt vé
export interface BookingTicket {
  id: number;
  priceAtBooking: string | null; // giá chốt lúc đặt, Decimal nên là chuỗi
  seat: { id: number; rowLabel: string; columnNumber: number; seatType: { id: number; name: string } };
}

// Đơn đặt vé (GET /bookings/:id, GET /bookings/me)
export interface Booking {
  id: number;
  userId: number;
  showtimeId: number;
  createdAt: string; // dạng ISO
  totalAmount: string; // Decimal nên là chuỗi, ví dụ "190000"
  status: BookingStatus;
  showtime: {
    id: number;
    showDate: string; // "YYYY-MM-DD"
    startTime: string; // "HH:mm"
    endTime: string;
    movie: { id: number; title: string; duration: number; ageRating: string | null; posterUrl: string | null };
    room: { id: number; name: string; cinema: { id: number; name: string; address: string } };
  };
  tickets: BookingTicket[];
}

// Admin xem tất cả đơn (GET /bookings): kèm thêm người đặt
export interface AdminBooking extends Booking {
  user: { id: number; email: string };
}
