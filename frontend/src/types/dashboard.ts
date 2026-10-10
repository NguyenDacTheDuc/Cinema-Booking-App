// Dữ liệu trang Tổng quan (GET /api/dashboard)

// Các con số ở hàng thẻ trên cùng
export interface DashboardSummary {
  revenueToday: number;
  revenueYesterday: number;
  revenueThisMonth: number;
  ticketsToday: number;
  ticketsYesterday: number;
  bookingsToday: number;
  bookingsYesterday: number;
  nowShowingMovies: number;
  comingSoonMovies: number;
}

// Doanh thu một ngày (30 ngày gần nhất, ngày cuối là hôm nay)
export interface DailySales {
  date: string; // "YYYY-MM-DD"
  revenue: number;
  tickets: number;
  bookings: number;
}

// Phim bán chạy trong 7 ngày gần nhất
export interface TopMovie {
  movieId: number;
  title: string;
  tickets: number;
  revenue: number;
}

// Trạng thái suất chiếu theo giờ hiện tại: sắp chiếu / đang chiếu / đã chiếu
export type ShowtimeState = 'upcoming' | 'showing' | 'ended';

export interface TodayShowtime {
  id: number;
  startTime: string; // "HH:mm"
  endTime: string;
  state: ShowtimeState;
  movie: { id: number; title: string };
  room: { id: number; name: string; cinema: { id: number; name: string } };
  soldSeats: number;
  totalSeats: number;
}

export interface LatestBooking {
  id: number;
  bookingCode: string;
  createdAt: string; // dạng ISO
  totalAmount: number;
  user: { id: number; fullName: string; email: string };
  showtime: { id: number; showDate: string; startTime: string; movie: { id: number; title: string } };
  seats: string[]; // ví dụ ["E5", "E6"]
}

export interface DashboardData {
  summary: DashboardSummary;
  revenueByDay: DailySales[];
  topMovies: TopMovie[];
  todayShowtimes: TodayShowtime[];
  latestBookings: LatestBooking[];
}
