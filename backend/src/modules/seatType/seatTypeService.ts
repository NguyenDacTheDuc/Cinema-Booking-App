import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { DEFAULT_SEAT_TYPE_ID } from '../../config/constants';
import { AppError } from '../../utils/appError';
import { CreateSeatTypeInput, UpdateSeatTypeInput } from './seatTypeValidator';

export async function getSeatTypes() {
  return prisma.seatType.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function createSeatType(input: CreateSeatTypeInput) {
  try {
    return await prisma.seatType.create({
      data: { name: input.name, price: input.price },
    });
  } catch (err) {
    // P2002: trùng tên (cột name có @unique)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Tên loại ghế đã tồn tại', 409);
    }
    throw err;
  }
}

export async function updateSeatType(id: number, input: UpdateSeatTypeInput) {
  // Chỉ cập nhật những trường thực sự được gửi lên
  // (bắt buộc vì tsconfig bật exactOptionalPropertyTypes)
  const data: Prisma.SeatTypeUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.price !== undefined) data.price = input.price;

  try {
    return await prisma.seatType.update({ where: { id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: không tìm thấy loại ghế cần sửa
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy loại ghế', 404);
      }
      if (err.code === 'P2002') {
        throw new AppError('Tên loại ghế đã tồn tại', 409);
      }
    }
    throw err;
  }
}

export async function deleteSeatType(id: number) {
  // Loại ghế mặc định được Room dùng để gán cho ghế khi tự sinh ghế,
  // xóa đi thì không tạo được phòng mới
  if (id === DEFAULT_SEAT_TYPE_ID) {
    throw new AppError('Không thể xóa loại ghế mặc định', 400);
  }

  try {
    await prisma.seatType.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy loại ghế', 404);
      }
      // P2003: vi phạm khóa ngoại, loại ghế đang được ghế trong phòng chiếu sử dụng
      // (quan hệ Seat - SeatType là Restrict nên database tự chặn xóa)
      if (err.code === 'P2003') {
        throw new AppError('Loại ghế đang được sử dụng, hãy đổi loại cho các ghế đó trước khi xóa', 409);
      }
    }
    throw err;
  }
}
