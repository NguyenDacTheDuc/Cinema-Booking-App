import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { CLEANING_MINUTES } from '../../config/constants';
import { AppError } from '../../utils/appError';
import { getTodayDate } from '../../utils/getTodayDate';
import { CreateShowtimeInput, UpdateShowtimeInput } from './showtimeValidator';

// ======================= Xử lý ngày giờ =======================
// Quy ước trong module này:
// - showDate (cột DATE): lưu dạng Date lúc 00:00 UTC của ngày đó
// - startTime, endTime (cột TIME): Prisma đọc/ghi dưới dạng Date ngày 1970-01-01,
//   phần giờ phút tính theo UTC. Mọi phép so sánh giờ đều đổi ra "số phút trong ngày"
//   (0 -> 1439) rồi so sánh trong code, tránh so sánh trực tiếp cột TIME trong câu query.

const MINUTES_PER_DAY = 24 * 60;

// "2026-10-10" -> Date 2026-10-10T00:00:00.000Z
function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

// "19:30" -> 1170
function timeStringToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

// 1170 -> Date 1970-01-01T19:30:00.000Z (để ghi vào cột TIME)
function minutesToTimeDate(minutes: number): Date {
  return new Date(Date.UTC(1970, 0, 1, 0, minutes));
}

// Date đọc từ cột TIME -> số phút trong ngày
function timeDateToMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

// Số phút đã trôi qua trong ngày hôm nay theo giờ Việt Nam (UTC+7)
function getNowMinutes(): number {
  const vietnamNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return vietnamNow.getUTCHours() * 60 + vietnamNow.getUTCMinutes();
}

// Định dạng trả về cho client: tránh để frontend tự đổi Date 1970-01-01 theo
// múi giờ trình duyệt (dễ hiển thị sai giờ, ví dụ 19:30 thành 02:30)
function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatTime(value: Date): string {
  const minutes = timeDateToMinutes(value);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

// ======================= Dữ liệu trả về =======================

const showtimeInclude = {
  movie: { select: { id: true, title: true, duration: true, ageRating: true, posterUrl: true } },
  room: {
    select: {
      id: true,
      name: true,
      cinema: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ShowtimeInclude;

type ShowtimeWithRelations = Prisma.ShowtimeGetPayload<{ include: typeof showtimeInclude }>;

function formatShowtime(showtime: ShowtimeWithRelations) {
  return {
    ...showtime,
    showDate: formatDate(showtime.showDate),
    startTime: formatTime(showtime.startTime),
    endTime: formatTime(showtime.endTime),
  };
}

// ======================= Tự cập nhật trạng thái =======================

// Chuyển các suất đã chiếu xong sang ended. Chạy mỗi khi đọc suất chiếu
// thay vì dùng cron, cùng cách làm với Movie và việc tự nhả ghế (UC20).
async function syncShowtimeStatus() {
  const today = getTodayDate();

  // 1. Các ngày đã qua: chắc chắn đã chiếu xong
  await prisma.showtime.updateMany({
    where: { status: 'scheduled', showDate: { lt: today } },
    data: { status: 'ended' },
  });

  // 2. Hôm nay: chỉ những suất đã qua giờ kết thúc (so sánh giờ trong code)
  const todayShowtimes = await prisma.showtime.findMany({
    where: { status: 'scheduled', showDate: today },
    select: { id: true, endTime: true },
  });
  const nowMinutes = getNowMinutes();
  const endedIds = todayShowtimes.filter((s) => timeDateToMinutes(s.endTime) <= nowMinutes).map((s) => s.id);

  if (endedIds.length > 0) {
    await prisma.showtime.updateMany({
      where: { id: { in: endedIds } },
      data: { status: 'ended' },
    });
  }
}

// ======================= Kiểm tra nghiệp vụ =======================

interface ScheduleCheck {
  roomId: number;
  showDate: Date;
  startMinutes: number;
  endMinutes: number;
  movie: { releaseDate: Date | null; endDate: Date | null };
  excludeShowtimeId?: number; // bỏ qua chính suất đang sửa khi kiểm tra trùng giờ
}

// Dùng chung cho tạo và sửa suất chiếu
async function validateSchedule(check: ScheduleCheck) {
  const today = getTodayDate();
  const showDateTime = check.showDate.getTime();

  // Không tạo/sửa suất chiếu vào ngày đã qua, hoặc giờ đã qua của hôm nay
  if (showDateTime < today.getTime()) {
    throw new AppError('Không thể đặt lịch chiếu vào ngày đã qua', 400);
  }
  if (showDateTime === today.getTime() && check.startMinutes <= getNowMinutes()) {
    throw new AppError('Giờ bắt đầu đã qua, hãy chọn giờ khác', 400);
  }

  // Giới hạn hiện tại: suất chiếu phải kết thúc trong ngày (cột TIME không lưu được sang ngày hôm sau)
  if (check.endMinutes >= MINUTES_PER_DAY) {
    throw new AppError('Suất chiếu phải kết thúc trước 24:00', 400);
  }

  // Ngày chiếu phải nằm trong thời gian phát hành của phim
  const { releaseDate, endDate } = check.movie;
  if (releaseDate && showDateTime < releaseDate.getTime()) {
    throw new AppError('Ngày chiếu không được trước ngày khởi chiếu của phim', 400);
  }
  if (endDate && showDateTime > endDate.getTime()) {
    throw new AppError('Ngày chiếu không được sau ngày kết thúc chiếu của phim', 400);
  }

  // Trùng giờ trong cùng phòng: mỗi suất chiếm phòng từ giờ bắt đầu
  // tới giờ kết thúc + thời gian dọn phòng. Hai khoảng giao nhau là trùng.
  const sameDayShowtimes = await prisma.showtime.findMany({
    where: {
      roomId: check.roomId,
      showDate: check.showDate,
      ...(check.excludeShowtimeId !== undefined && { id: { not: check.excludeShowtimeId } }),
    },
    select: { startTime: true, endTime: true },
  });

  const newStart = check.startMinutes;
  const newEnd = check.endMinutes + CLEANING_MINUTES;
  const isOverlapping = sameDayShowtimes.some((s) => {
    const existingStart = timeDateToMinutes(s.startTime);
    const existingEnd = timeDateToMinutes(s.endTime) + CLEANING_MINUTES;
    return newStart < existingEnd && existingStart < newEnd;
  });

  if (isOverlapping) {
    throw new AppError(`Phòng đã có suất chiếu trong khung giờ này (cần cách nhau ít nhất ${CLEANING_MINUTES} phút để dọn phòng)`, 409);
  }
}

// ======================= API =======================

export interface ShowtimeFilter {
  movieId?: number;
  cinemaId?: number;
  date?: string; // dạng YYYY-MM-DD
}

// Công khai: danh sách suất chiếu.
// Không gửi date: các suất từ hôm nay trở đi. Có gửi date: đúng ngày đó (kể cả ngày đã qua).
export async function getShowtimes(filter: ShowtimeFilter) {
  await syncShowtimeStatus();

  const where: Prisma.ShowtimeWhereInput = {};
  if (filter.movieId !== undefined) where.movieId = filter.movieId;
  if (filter.cinemaId !== undefined) where.room = { cinemaId: filter.cinemaId };

  if (filter.date !== undefined) {
    const date = toDateOnly(filter.date);
    // JS tự đổi ngày không tồn tại (2026-02-30 -> 2026-03-02) thay vì báo lỗi,
    // nên phải so sánh lại với chuỗi gốc để chặn
    if (Number.isNaN(date.getTime()) || formatDate(date) !== filter.date) {
      throw new AppError('Ngày lọc không hợp lệ (định dạng YYYY-MM-DD)', 400);
    }
    where.showDate = date;
  } else {
    where.showDate = { gte: getTodayDate() };
  }

  const showtimes = await prisma.showtime.findMany({
    where,
    include: showtimeInclude,
    orderBy: [{ showDate: 'asc' }, { startTime: 'asc' }],
  });
  return showtimes.map(formatShowtime);
}

export async function getShowtimeById(id: number) {
  await syncShowtimeStatus();

  const showtime = await prisma.showtime.findUnique({
    where: { id },
    include: showtimeInclude,
  });
  if (!showtime) {
    throw new AppError('Không tìm thấy suất chiếu', 404);
  }
  return formatShowtime(showtime);
}

export async function createShowtime(input: CreateShowtimeInput) {
  const movie = await prisma.movie.findUnique({
    where: { id: input.movieId },
    select: { duration: true, releaseDate: true, endDate: true },
  });
  if (!movie) {
    throw new AppError('Không tìm thấy phim', 404);
  }

  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
    select: { status: true },
  });
  if (!room) {
    throw new AppError('Không tìm thấy phòng', 404);
  }
  if (room.status !== 'active') {
    throw new AppError('Phòng đang ngừng hoạt động, không thể tạo suất chiếu', 400);
  }

  const showDate = toDateOnly(input.showDate);
  const startMinutes = timeStringToMinutes(input.startTime);
  // Giờ kết thúc tự tính theo thời lượng phim
  const endMinutes = startMinutes + movie.duration;

  await validateSchedule({ roomId: input.roomId, showDate, startMinutes, endMinutes, movie });

  // Tạo suất chiếu và sinh sẵn vé (available) cho mọi ghế của phòng
  // trong cùng 1 transaction: lỗi giữa chừng thì không còn suất chiếu thiếu vé.
  const showtime = await prisma.$transaction(async (tx) => {
    const created = await tx.showtime.create({
      data: {
        movieId: input.movieId,
        roomId: input.roomId,
        showDate,
        startTime: minutesToTimeDate(startMinutes),
        endTime: minutesToTimeDate(endMinutes),
      },
    });

    const seats = await tx.seat.findMany({
      where: { roomId: input.roomId },
      select: { id: true },
    });
    await tx.ticket.createMany({
      data: seats.map((seat) => ({ showtimeId: created.id, seatId: seat.id })),
    });

    return tx.showtime.findUniqueOrThrow({
      where: { id: created.id },
      include: showtimeInclude,
    });
  });

  return formatShowtime(showtime);
}

export async function updateShowtime(id: number, input: UpdateShowtimeInput) {
  const existing = await prisma.showtime.findUnique({
    where: { id },
    include: { movie: { select: { duration: true, releaseDate: true, endDate: true } } },
  });
  if (!existing) {
    throw new AppError('Không tìm thấy suất chiếu', 404);
  }

  // Đã có người đặt vé thì không cho sửa gì nữa
  const bookingCount = await prisma.booking.count({ where: { showtimeId: id } });
  if (bookingCount > 0) {
    throw new AppError('Suất chiếu đã có người đặt vé, không thể sửa', 409);
  }

  // Field nào không gửi thì giữ giá trị cũ, sau đó kiểm tra lại toàn bộ lịch chiếu mới
  const showDate = input.showDate !== undefined ? toDateOnly(input.showDate) : existing.showDate;
  const startMinutes = input.startTime !== undefined ? timeStringToMinutes(input.startTime) : timeDateToMinutes(existing.startTime);
  const endMinutes = startMinutes + existing.movie.duration;

  await validateSchedule({
    roomId: existing.roomId,
    showDate,
    startMinutes,
    endMinutes,
    movie: existing.movie,
    excludeShowtimeId: id,
  });

  const showtime = await prisma.showtime.update({
    where: { id },
    data: {
      showDate,
      startTime: minutesToTimeDate(startMinutes),
      endTime: minutesToTimeDate(endMinutes),
      // Lịch mới luôn ở tương lai (validateSchedule đã chặn quá khứ) nên trở về sắp chiếu
      status: 'scheduled',
    },
    include: showtimeInclude,
  });

  return formatShowtime(showtime);
}

export async function deleteShowtime(id: number) {
  try {
    // Xóa toàn bộ vé trước rồi mới xóa suất chiếu (quan hệ Ticket - Showtime là Restrict).
    // Gói chung 1 transaction: nếu đã có đơn đặt vé thì database chặn xóa suất chiếu
    // (Booking tham chiếu tới Showtime), các vé vừa xóa được khôi phục lại.
    await prisma.$transaction([prisma.ticket.deleteMany({ where: { showtimeId: id } }), prisma.showtime.delete({ where: { id } })]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy suất chiếu', 404);
      }
      // P2003: đã có đơn đặt vé tham chiếu tới suất chiếu
      if (err.code === 'P2003') {
        throw new AppError('Suất chiếu đã có người đặt vé, không thể xóa', 409);
      }
    }
    throw err;
  }
}
