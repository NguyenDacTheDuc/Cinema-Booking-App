import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { UpdateSeatInput } from './seatValidator';

// Kèm thông tin loại ghế (id, tên, giá) mỗi khi trả ghế về
const seatInclude = {
  seatType: { select: { id: true, name: true, price: true } },
} satisfies Prisma.SeatInclude;

// Admin: sơ đồ ghế của 1 phòng, sắp theo hàng (A, B, C...) rồi theo số ghế
export async function getSeatsByRoom(roomId: number) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true },
  });
  if (!room) {
    throw new AppError('Không tìm thấy phòng', 404);
  }

  return prisma.seat.findMany({
    where: { roomId },
    include: seatInclude,
    orderBy: [{ rowLabel: 'asc' }, { columnNumber: 'asc' }],
  });
}

// Admin: đổi loại ghế (thường, VIP, đôi...)
export async function updateSeat(id: number, input: UpdateSeatInput) {
  try {
    return await prisma.seat.update({
      where: { id },
      data: { seatTypeId: input.seatTypeId },
      include: seatInclude,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: không tìm thấy ghế cần sửa
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy ghế', 404);
      }
      // P2003: seatTypeId không tồn tại trong bảng SeatType
      if (err.code === 'P2003') {
        throw new AppError('Loại ghế không tồn tại', 400);
      }
    }
    throw err;
  }
}
