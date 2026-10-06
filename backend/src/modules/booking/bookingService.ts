import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { SEAT_LOCK_MINUTES, ONLINE_SALES_CUTOFF_MINUTES } from '../../config/constants';
import { AppError } from '../../utils/appError';
import { JwtPayload } from '../../utils/jwt';
import { formatDate, formatTime, getShowtimeStartAt } from '../../utils/dateTime';
import { LockSeatsInput, CreateBookingInput } from './bookingValidator';

const MS_PER_MINUTE = 60 * 1000;

const SEATS_TAKEN_MESSAGE = 'Một số ghế bạn chọn vừa có người khác giữ hoặc đã được đặt, vui lòng chọn ghế khác';

// ======================= Dữ liệu trả về =======================

// Thông tin ghế kèm loại ghế và giá hiện tại
const seatSelect = {
  id: true,
  rowLabel: true,
  columnNumber: true,
  seatType: { select: { id: true, name: true, price: true } },
} satisfies Prisma.SeatSelect;

// Sắp vé theo hàng (A, B, C...) rồi theo số ghế
const ticketOrderBy = [{ seat: { rowLabel: 'asc' } }, { seat: { columnNumber: 'asc' } }] satisfies Prisma.TicketOrderByWithRelationInput[];

// Thông tin đầy đủ của 1 đơn đặt vé (dùng cho vé điện tử và lịch sử đặt vé)
const bookingInclude = {
  showtime: {
    select: {
      id: true,
      showDate: true,
      startTime: true,
      endTime: true,
      movie: { select: { id: true, title: true, duration: true, ageRating: true, posterUrl: true } },
      room: {
        select: {
          id: true,
          name: true,
          cinema: { select: { id: true, name: true, address: true } },
        },
      },
    },
  },
  tickets: {
    select: {
      id: true,
      priceAtBooking: true,
      seat: {
        select: {
          id: true,
          rowLabel: true,
          columnNumber: true,
          seatType: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: ticketOrderBy,
  },
} satisfies Prisma.BookingInclude;

// Admin xem tất cả đơn: kèm thêm người đặt
const adminBookingInclude = {
  ...bookingInclude,
  user: { select: { id: true, email: true } },
} satisfies Prisma.BookingInclude;

type BookingWithRelations = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

// Trả ngày giờ suất chiếu dạng "YYYY-MM-DD" và "HH:mm" (giống module showtime)
function formatBooking<T extends BookingWithRelations>(booking: T) {
  return {
    ...booking,
    showtime: {
      ...booking.showtime,
      showDate: formatDate(booking.showtime.showDate),
      startTime: formatTime(booking.showtime.startTime),
      endTime: formatTime(booking.showtime.endTime),
    },
  };
}

// ======================= Hàm hỗ trợ =======================

// Prisma P2034: transaction thất bại do xung đột ghi hoặc deadlock
// (xảy ra khi nhiều người tranh cùng ghế trong cùng một khoảnh khắc)
function isWriteConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
}

async function findShowtimeOrThrow(showtimeId: number) {
  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    select: { id: true, showDate: true, startTime: true },
  });
  if (!showtime) {
    throw new AppError('Không tìm thấy suất chiếu', 404);
  }
  return showtime;
}

// Nhả các ghế đã hết thời gian giữ của 1 suất chiếu (UC20).
// Chạy mỗi khi đọc sơ đồ ghế thay vì dùng cron, cùng cách làm với Movie và Showtime.
async function releaseExpiredLocks(showtimeId: number) {
  await prisma.ticket.updateMany({
    where: { showtimeId, status: 'locked', lockedUntil: { lte: new Date() } },
    data: { status: 'available', lockedByUserId: null, lockedUntil: null },
  });
}

// Các ghế khách đang giữ (còn hạn) ở 1 suất chiếu, kèm tổng tiền tạm tính
async function getMyHold(userId: number, showtimeId: number) {
  const tickets = await prisma.ticket.findMany({
    where: { showtimeId, lockedByUserId: userId, status: 'locked', lockedUntil: { gt: new Date() } },
    select: { lockedUntil: true, seat: { select: seatSelect } },
    orderBy: ticketOrderBy,
  });

  const totalAmount = tickets.reduce((sum, ticket) => sum.plus(ticket.seat.seatType.price), new Prisma.Decimal(0));

  return {
    showtimeId,
    // Các ghế giữ cùng lúc nên có chung hạn giữ, frontend dùng để đếm ngược
    lockedUntil: tickets[0]?.lockedUntil ?? null,
    seats: tickets.map((ticket) => ticket.seat),
    totalAmount,
  };
}

// Thông báo khi thanh toán mà không còn ghế nào đang giữ:
// - Vừa thanh toán xong (bấm nút thanh toán lần 2) -> báo đã thanh toán
// - Còn lại: chưa giữ ghế hoặc đã hết thời gian giữ
async function getMissingHoldError(userId: number, showtimeId: number): Promise<AppError> {
  const recentBooking = await prisma.booking.findFirst({
    where: {
      userId,
      showtimeId,
      status: 'confirmed',
      createdAt: { gte: new Date(Date.now() - SEAT_LOCK_MINUTES * MS_PER_MINUTE) },
    },
    select: { id: true },
  });
  if (recentBooking) {
    return new AppError('Bạn đã thanh toán cho các ghế này, vui lòng xem lại trong lịch sử đặt vé', 409);
  }
  return new AppError('Bạn chưa giữ ghế nào hoặc thời gian giữ ghế đã hết, vui lòng chọn lại ghế', 400);
}

// Dùng nội bộ: báo cho createBooking biết có ghế bị mất quyền giữ ngay lúc thanh toán
class HoldLostError extends Error {}

async function findBookingDetail(id: number) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id },
    include: bookingInclude,
  });
  return formatBooking(booking);
}

// ======================= API =======================

// Công khai: sơ đồ ghế của 1 suất chiếu kèm trạng thái từng ghế.
// Không trả lockedByUserId để không lộ ai đang giữ ghế.
export async function getSeatMap(showtimeId: number) {
  await findShowtimeOrThrow(showtimeId);
  await releaseExpiredLocks(showtimeId);

  const tickets = await prisma.ticket.findMany({
    where: { showtimeId },
    select: { status: true, seat: { select: seatSelect } },
    orderBy: ticketOrderBy,
  });

  return tickets.map((ticket) => ({ ...ticket.seat, status: ticket.status }));
}

// Khách: giữ ghế trong SEAT_LOCK_MINUTES phút
export async function lockSeats(userId: number, showtimeId: number, input: LockSeatsInput) {
  // Loại id ghế trùng, tránh đếm sai số vé giữ được ở bước kiểm tra cuối
  const seatIds = [...new Set(input.seatIds)];

  const showtime = await findShowtimeOrThrow(showtimeId);

  // Ngừng giữ ghế trước giờ chiếu ONLINE_SALES_CUTOFF_MINUTES phút.
  // So trực tiếp với giờ bắt đầu, không dựa vào status của suất chiếu.
  const startAt = getShowtimeStartAt(showtime.showDate, showtime.startTime);
  if (Date.now() >= startAt.getTime() - ONLINE_SALES_CUTOFF_MINUTES * MS_PER_MINUTE) {
    throw new AppError(`Suất chiếu đã ngừng bán vé trực tuyến (ngừng trước giờ chiếu ${ONLINE_SALES_CUTOFF_MINUTES} phút)`, 400);
  }

  // Mỗi khách chỉ được giữ ghế ở 1 suất chiếu tại 1 thời điểm
  const holdInOtherShowtime = await prisma.ticket.findFirst({
    where: {
      lockedByUserId: userId,
      status: 'locked',
      lockedUntil: { gt: new Date() },
      showtimeId: { not: showtimeId },
    },
    select: { id: true },
  });
  if (holdInOtherShowtime) {
    throw new AppError('Bạn đang giữ ghế ở một suất chiếu khác, vui lòng hoàn tất thanh toán trước khi chọn suất chiếu mới', 409);
  }

  // Mỗi ghế của phòng đã có sẵn 1 vé khi tạo suất chiếu,
  // thiếu vé nghĩa là có ghế không thuộc phòng chiếu của suất này
  const validTicketCount = await prisma.ticket.count({
    where: { showtimeId, seatId: { in: seatIds } },
  });
  if (validTicketCount !== seatIds.length) {
    throw new AppError('Có ghế không thuộc phòng chiếu của suất chiếu này', 400);
  }

  // Các ghế khách đang giữ ở suất này (nếu có) sẽ được nhả trước khi giữ ghế mới
  const myOldTickets = await prisma.ticket.findMany({
    where: { showtimeId, lockedByUserId: userId, status: 'locked' },
    select: { id: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Nhả các ghế cũ của chính khách ở suất này (đổi ý chọn ghế khác).
      //    Cập nhật theo id để database chỉ khóa đúng các dòng vé đó.
      if (myOldTickets.length > 0) {
        await tx.ticket.updateMany({
          where: { id: { in: myOldTickets.map((t) => t.id) }, lockedByUserId: userId, status: 'locked' },
          data: { status: 'available', lockedByUserId: null, lockedUntil: null },
        });
      }

      // 2. Giữ ghế bằng 1 câu UPDATE có điều kiện: chỉ đổi những vé còn trống
      //    hoặc đang bị giữ nhưng đã hết hạn.
      //    Khi 2 người tranh cùng 1 ghế, MySQL (InnoDB) khóa dòng vé cho người đến trước;
      //    người đến sau phải chờ người trước commit, rồi đọc lại dữ liệu mới nhất,
      //    thấy vé đã bị giữ nên không khớp điều kiện và không đổi được vé đó.
      const { count } = await tx.ticket.updateMany({
        where: {
          showtimeId,
          seatId: { in: seatIds },
          OR: [{ status: 'available' }, { status: 'locked', lockedUntil: { lte: now } }],
        },
        data: {
          status: 'locked',
          lockedByUserId: userId,
          lockedUntil: new Date(now.getTime() + SEAT_LOCK_MINUTES * MS_PER_MINUTE),
        },
      });

      // 3. Thiếu vé nghĩa là có ghế đã thuộc về người khác:
      //    hủy toàn bộ (rollback), kể cả bước nhả ghế cũ ở trên
      if (count !== seatIds.length) {
        throw new AppError(SEATS_TAKEN_MESSAGE, 409);
      }
    });
  } catch (err) {
    if (isWriteConflict(err)) {
      throw new AppError(SEATS_TAKEN_MESSAGE, 409);
    }
    throw err;
  }

  return getMyHold(userId, showtimeId);
}

// Khách: thanh toán (giả lập) các ghế đang giữ ở 1 suất chiếu.
// Không kiểm tra mốc ngừng bán: ghế còn trong thời gian giữ là được thanh toán.
export async function createBooking(userId: number, input: CreateBookingInput) {
  const { showtimeId } = input;
  await findShowtimeOrThrow(showtimeId);

  let bookingId: number | null;
  try {
    bookingId = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Chỉ lấy ghế do chính khách này giữ và còn hạn, nên không thể thanh toán ghế của người khác
      const heldTickets = await tx.ticket.findMany({
        where: { showtimeId, lockedByUserId: userId, status: 'locked', lockedUntil: { gt: now } },
        select: { id: true, seat: { select: { seatType: { select: { id: true, price: true } } } } },
      });
      if (heldTickets.length === 0) {
        return null;
      }

      // Chốt giá theo loại ghế tại thời điểm thanh toán.
      // Gom vé theo loại ghế để mỗi loại chỉ cần 1 câu UPDATE.
      let totalAmount = new Prisma.Decimal(0);
      const ticketsBySeatType = new Map<number, { price: Prisma.Decimal; ticketIds: number[] }>();
      for (const ticket of heldTickets) {
        const { id: seatTypeId, price } = ticket.seat.seatType;
        totalAmount = totalAmount.plus(price);
        const group = ticketsBySeatType.get(seatTypeId);
        if (group) {
          group.ticketIds.push(ticket.id);
        } else {
          ticketsBySeatType.set(seatTypeId, { price, ticketIds: [ticket.id] });
        }
      }

      // Chưa tích hợp cổng thanh toán: tạo đơn ở trạng thái đã xác nhận luôn.
      // (pending để dành cho lúc chờ cổng thanh toán báo kết quả)
      const booking = await tx.booking.create({
        data: { userId, showtimeId, totalAmount, status: 'confirmed' },
        select: { id: true },
      });

      // Chuyển vé sang booked, vẫn kèm điều kiện "khách này còn đang giữ và còn hạn":
      // nếu hết hạn giữ đúng lúc thanh toán thì không bán trùng ghế cho người khác
      let bookedCount = 0;
      for (const { price, ticketIds } of ticketsBySeatType.values()) {
        const { count } = await tx.ticket.updateMany({
          where: { id: { in: ticketIds }, lockedByUserId: userId, status: 'locked', lockedUntil: { gt: now } },
          data: {
            status: 'booked',
            bookingId: booking.id,
            priceAtBooking: price,
            lockedByUserId: null,
            lockedUntil: null,
          },
        });
        bookedCount += count;
      }

      // Có vé không chuyển được: hủy toàn bộ, kể cả đơn vừa tạo (rollback)
      if (bookedCount !== heldTickets.length) {
        throw new HoldLostError();
      }
      return booking.id;
    });
  } catch (err) {
    // Mất quyền giữ ghế giữa chừng, hoặc 2 lần bấm thanh toán chạy song song
    if (err instanceof HoldLostError || isWriteConflict(err)) {
      bookingId = null;
    } else {
      throw err;
    }
  }

  if (bookingId === null) {
    throw await getMissingHoldError(userId, showtimeId);
  }

  return findBookingDetail(bookingId);
}

// Khách: lịch sử đặt vé của chính mình, mới nhất trước
export async function getMyBookings(userId: number) {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { createdAt: 'desc' },
  });
  return bookings.map(formatBooking);
}

// Chi tiết 1 đơn (vé điện tử): chủ đơn hoặc admin mới xem được.
// Người khác nhận 404 thay vì 403 để không lộ việc đơn đó có tồn tại.
export async function getBookingById(id: number, user: JwtPayload) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });
  if (!booking || (user.role !== 'admin' && booking.userId !== user.userId)) {
    throw new AppError('Không tìm thấy đơn đặt vé', 404);
  }
  return formatBooking(booking);
}

// Admin: tất cả đơn đặt vé, kèm người đặt
export async function getAllBookings() {
  const bookings = await prisma.booking.findMany({
    include: adminBookingInclude,
    orderBy: { createdAt: 'desc' },
  });
  return bookings.map(formatBooking);
}
