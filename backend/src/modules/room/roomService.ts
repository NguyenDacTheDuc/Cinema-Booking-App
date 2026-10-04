import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { DEFAULT_SEAT_TYPE_ID } from '../../config/constants';
import { AppError } from '../../utils/appError';
import { getTodayDate } from '../../utils/getTodayDate';
import { CreateRoomInput, UpdateRoomInput } from './roomValidator';

// Kèm số lượng ghế của phòng mỗi khi trả phòng về
const roomInclude = {
  _count: { select: { seats: true } },
} satisfies Prisma.RoomInclude;

// Sinh danh sách ghế theo số hàng và số cột.
// Hàng đặt tên A, B, C... (tối đa 26 hàng, validator đã chặn),
// cột đánh số 1, 2, 3...; mọi ghế mặc định là loại "thường".
function generateSeats(rows: number, columns: number) {
  const seats: { rowLabel: string; columnNumber: number; seatTypeId: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r); // 65 là mã của chữ 'A'
    for (let c = 1; c <= columns; c++) {
      seats.push({ rowLabel, columnNumber: c, seatTypeId: DEFAULT_SEAT_TYPE_ID });
    }
  }
  return seats;
}

// Khách hàng: danh sách phòng đang active của 1 rạp.
// Rạp inactive coi như không tồn tại với khách, trả 404 (giống GET /cinemas/:id).
export async function getActiveRooms(cinemaId: number) {
  const cinema = await prisma.cinema.findFirst({
    where: { id: cinemaId, status: 'active' },
    select: { id: true },
  });
  if (!cinema) {
    throw new AppError('Không tìm thấy rạp', 404);
  }

  return prisma.room.findMany({
    where: { cinemaId, status: 'active' },
    orderBy: { name: 'asc' },
  });
}

// Admin: tất cả phòng của 1 rạp, kể cả inactive, kèm số lượng ghế
export async function getAllRooms(cinemaId: number) {
  const cinema = await prisma.cinema.findUnique({
    where: { id: cinemaId },
    select: { id: true },
  });
  if (!cinema) {
    throw new AppError('Không tìm thấy rạp', 404);
  }

  return prisma.room.findMany({
    where: { cinemaId },
    include: roomInclude,
    orderBy: { id: 'asc' },
  });
}

export async function createRoom(input: CreateRoomInput) {
  // Kiểm tra rạp trước để báo lỗi rõ ràng.
  // Cho phép tạo phòng cho cả rạp inactive (admin chuẩn bị trước khi mở rạp).
  const cinema = await prisma.cinema.findUnique({
    where: { id: input.cinemaId },
    select: { id: true },
  });
  if (!cinema) {
    throw new AppError('Không tìm thấy rạp', 404);
  }

  try {
    // Tạo phòng và toàn bộ ghế trong cùng 1 lệnh (Prisma tự bọc transaction).
    // createMany gom tất cả ghế vào 1 câu INSERT, nhanh hơn tạo từng ghế
    // (tối đa 26 x 30 = 780 ghế).
    return await prisma.room.create({
      data: {
        cinemaId: input.cinemaId,
        name: input.name,
        seats: { createMany: { data: generateSeats(input.rows, input.columns) } },
      },
      include: roomInclude,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: trùng tên phòng trong cùng rạp (@@unique([cinemaId, name]))
      if (err.code === 'P2002') {
        throw new AppError('Tên phòng đã tồn tại trong rạp này', 409);
      }
      // P2003: rạp đã kiểm tra ở trên, nên chỉ có thể là thiếu loại ghế mặc định
      if (err.code === 'P2003') {
        throw new AppError('Không tìm thấy loại ghế mặc định, hãy kiểm tra dữ liệu seed', 500);
      }
    }
    throw err;
  }
}

export async function updateRoom(id: number, input: UpdateRoomInput) {
  // Không cho chuyển sang inactive khi phòng còn suất chiếu sắp tới
  // (ngày chiếu từ hôm nay trở đi). Suất đã chiếu xong thì không chặn.
  if (input.status === 'inactive') {
    const upcomingShowtimes = await prisma.showtime.count({
      where: { roomId: id, showDate: { gte: getTodayDate() } },
    });
    if (upcomingShowtimes > 0) {
      throw new AppError('Phòng đang có suất chiếu sắp tới, không thể chuyển sang inactive', 409);
    }
  }

  // Chỉ cập nhật những trường thực sự được gửi lên
  // (bắt buộc vì tsconfig bật exactOptionalPropertyTypes)
  const data: Prisma.RoomUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.status !== undefined) data.status = input.status;

  try {
    return await prisma.room.update({ where: { id }, data, include: roomInclude });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: không tìm thấy phòng cần sửa
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy phòng', 404);
      }
      if (err.code === 'P2002') {
        throw new AppError('Tên phòng đã tồn tại trong rạp này', 409);
      }
    }
    throw err;
  }
}

export async function deleteRoom(id: number) {
  try {
    // Xóa toàn bộ ghế trước rồi mới xóa phòng (quan hệ Seat - Room là Restrict).
    // Gói chung 1 transaction: nếu phòng đã từng có suất chiếu thì database chặn
    // (Showtime và Ticket tham chiếu tới phòng/ghế), các ghế vừa xóa được khôi phục lại.
    await prisma.$transaction([prisma.seat.deleteMany({ where: { roomId: id } }), prisma.room.delete({ where: { id } })]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy phòng', 404);
      }
      // P2003: phòng đã từng có suất chiếu (sắp tới hoặc đã chiếu xong)
      if (err.code === 'P2003') {
        throw new AppError('Phòng đã có suất chiếu, không thể xóa, chỉ có thể chuyển sang inactive', 409);
      }
    }
    throw err;
  }
}
