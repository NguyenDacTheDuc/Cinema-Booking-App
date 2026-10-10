import prisma from '../../config/prisma';
import { formatDate, formatTime, getShowtimeStartAt, timeDateToMinutes } from '../../utils/dateTime';
import { getTodayDate } from '../../utils/getTodayDate';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;
const VIETNAM_OFFSET_MS = 7 * 60 * MS_PER_MINUTE;

const REVENUE_DAYS = 30; // biểu đồ doanh thu: 30 ngày gần nhất (frontend tự cắt 7 ngày)
const TOP_MOVIE_DAYS = 7; // top phim bán chạy: 7 ngày gần nhất
const TOP_MOVIE_LIMIT = 5;
const LATEST_BOOKING_LIMIT = 8;

// ======================= Hàm hỗ trợ =======================

// Lùi (hoặc tiến) một ngày kiểu DATE đi n ngày
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

// Ngày kiểu DATE (00:00 UTC) -> thời điểm 00:00 giờ Việt Nam của ngày đó,
// để so sánh với cột createdAt (lưu thời điểm thực, theo UTC)
function startOfVietnamDay(date: Date): Date {
  return new Date(date.getTime() - VIETNAM_OFFSET_MS);
}

// Thời điểm thực -> ngày theo giờ Việt Nam dạng "YYYY-MM-DD"
function toVietnamDateString(value: Date): string {
  return formatDate(new Date(value.getTime() + VIETNAM_OFFSET_MS));
}

// ======================= Doanh thu, vé, top phim =======================

interface DailySales {
  date: string; // "YYYY-MM-DD"
  revenue: number;
  tickets: number;
  bookings: number;
}

interface MovieSales {
  movieId: number;
  title: string;
  tickets: number;
  revenue: number;
}

// Doanh thu theo ngày (30 ngày) và top phim (7 ngày), tính từ các đơn đã thanh toán.
// Lấy đơn một lần rồi cộng dồn, ngày nào không có đơn vẫn trả về với số 0 để vẽ biểu đồ liền mạch.
async function getSales(today: Date) {
  const firstDay = addDays(today, -(REVENUE_DAYS - 1));
  const topMovieFrom = startOfVietnamDay(addDays(today, -(TOP_MOVIE_DAYS - 1)));

  const bookings = await prisma.booking.findMany({
    where: { status: 'confirmed', createdAt: { gte: startOfVietnamDay(firstDay) } },
    select: {
      createdAt: true,
      totalAmount: true,
      _count: { select: { tickets: true } },
      showtime: { select: { movie: { select: { id: true, title: true } } } },
    },
  });

  const days = new Map<string, DailySales>();
  for (let i = 0; i < REVENUE_DAYS; i++) {
    const date = formatDate(addDays(firstDay, i));
    days.set(date, { date, revenue: 0, tickets: 0, bookings: 0 });
  }

  const movies = new Map<number, MovieSales>();

  for (const booking of bookings) {
    const amount = Number(booking.totalAmount);
    const tickets = booking._count.tickets;

    const day = days.get(toVietnamDateString(booking.createdAt));
    if (day) {
      day.revenue += amount;
      day.tickets += tickets;
      day.bookings += 1;
    }

    if (booking.createdAt >= topMovieFrom) {
      const { id, title } = booking.showtime.movie;
      const movie = movies.get(id) ?? { movieId: id, title, tickets: 0, revenue: 0 };
      movie.tickets += tickets;
      movie.revenue += amount;
      movies.set(id, movie);
    }
  }

  const topMovies = [...movies.values()].sort((a, b) => b.tickets - a.tickets || b.revenue - a.revenue).slice(0, TOP_MOVIE_LIMIT);

  return { revenueByDay: [...days.values()], topMovies };
}

// Doanh thu từ ngày 1 của tháng hiện tại (giờ Việt Nam) tới nay
async function getRevenueThisMonth(today: Date) {
  const firstDayOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const result = await prisma.booking.aggregate({
    where: { status: 'confirmed', createdAt: { gte: startOfVietnamDay(firstDayOfMonth) } },
    _sum: { totalAmount: true },
  });
  return Number(result._sum.totalAmount ?? 0);
}

// ======================= Phim =======================

// Đếm theo ngày khởi chiếu, cùng quy tắc tự cập nhật trạng thái ở module movie
// (phim coming_soon tới ngày khởi chiếu thì tính là đang chiếu)
async function countMovies(today: Date) {
  const [nowShowing, comingSoon] = await Promise.all([
    prisma.movie.count({
      where: { OR: [{ status: 'now_showing' }, { releaseDate: { lte: today } }] },
    }),
    prisma.movie.count({
      where: { status: 'coming_soon', OR: [{ releaseDate: null }, { releaseDate: { gt: today } }] },
    }),
  ]);
  return { nowShowing, comingSoon };
}

// ======================= Suất chiếu hôm nay =======================

// Trạng thái hiển thị theo giờ hiện tại: sắp chiếu / đang chiếu / đã chiếu
type ShowtimeState = 'upcoming' | 'showing' | 'ended';

async function getTodayShowtimes(today: Date) {
  const showtimes = await prisma.showtime.findMany({
    where: { showDate: today },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      movie: { select: { id: true, title: true } },
      room: {
        select: {
          id: true,
          name: true,
          cinema: { select: { id: true, name: true } },
          _count: { select: { seats: true } }, // tổng số ghế của phòng
        },
      },
      _count: { select: { tickets: { where: { status: 'booked' } } } }, // số ghế đã bán
    },
    orderBy: { startTime: 'asc' },
  });

  const now = Date.now();

  return showtimes.map((showtime) => {
    const startAt = getShowtimeStartAt(today, showtime.startTime).getTime();
    let durationMinutes = timeDateToMinutes(showtime.endTime) - timeDateToMinutes(showtime.startTime);
    if (durationMinutes <= 0) durationMinutes += 24 * 60; // suất chiếu kết thúc sau nửa đêm
    const endAt = startAt + durationMinutes * MS_PER_MINUTE;

    let state: ShowtimeState = 'ended';
    if (now < startAt) state = 'upcoming';
    else if (now < endAt) state = 'showing';

    return {
      id: showtime.id,
      startTime: formatTime(showtime.startTime),
      endTime: formatTime(showtime.endTime),
      state,
      movie: showtime.movie,
      room: { id: showtime.room.id, name: showtime.room.name, cinema: showtime.room.cinema },
      soldSeats: showtime._count.tickets,
      totalSeats: showtime.room._count.seats,
    };
  });
}

// ======================= Đơn đặt vé mới nhất =======================

async function getLatestBookings() {
  const bookings = await prisma.booking.findMany({
    where: { status: 'confirmed' },
    orderBy: { createdAt: 'desc' },
    take: LATEST_BOOKING_LIMIT,
    select: {
      id: true,
      bookingCode: true,
      createdAt: true,
      totalAmount: true,
      user: { select: { id: true, fullName: true, email: true } },
      showtime: {
        select: {
          id: true,
          showDate: true,
          startTime: true,
          movie: { select: { id: true, title: true } },
        },
      },
      tickets: {
        select: { seat: { select: { rowLabel: true, columnNumber: true } } },
        orderBy: [{ seat: { rowLabel: 'asc' } }, { seat: { columnNumber: 'asc' } }],
      },
    },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    bookingCode: booking.bookingCode,
    createdAt: booking.createdAt,
    totalAmount: Number(booking.totalAmount),
    user: booking.user,
    showtime: {
      id: booking.showtime.id,
      showDate: formatDate(booking.showtime.showDate),
      startTime: formatTime(booking.showtime.startTime),
      movie: booking.showtime.movie,
    },
    seats: booking.tickets.map((ticket) => `${ticket.seat.rowLabel}${ticket.seat.columnNumber}`),
  }));
}

// ======================= Tổng hợp =======================

// Admin: toàn bộ số liệu cho trang Tổng quan, chạy song song các truy vấn
export async function getDashboard() {
  const today = getTodayDate();

  const [sales, revenueThisMonth, movieCount, todayShowtimes, latestBookings] = await Promise.all([
    getSales(today),
    getRevenueThisMonth(today),
    countMovies(today),
    getTodayShowtimes(today),
    getLatestBookings(),
  ]);

  const { revenueByDay, topMovies } = sales;
  const emptyDay = { revenue: 0, tickets: 0, bookings: 0 };
  const todaySales = revenueByDay[revenueByDay.length - 1] ?? emptyDay;
  const yesterdaySales = revenueByDay[revenueByDay.length - 2] ?? emptyDay;

  return {
    summary: {
      revenueToday: todaySales.revenue,
      revenueYesterday: yesterdaySales.revenue,
      revenueThisMonth,
      ticketsToday: todaySales.tickets,
      ticketsYesterday: yesterdaySales.tickets,
      bookingsToday: todaySales.bookings,
      bookingsYesterday: yesterdaySales.bookings,
      nowShowingMovies: movieCount.nowShowing,
      comingSoonMovies: movieCount.comingSoon,
    },
    revenueByDay,
    topMovies,
    todayShowtimes,
    latestBookings,
  };
}
