import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { CreateCinemaInput, UpdateCinemaInput } from './cinemaValidator';

// Khách hàng: chỉ thấy rạp đang active
export async function getActiveCinemas() {
  return prisma.cinema.findMany({
    where: { status: 'active' },
    orderBy: { name: 'asc' },
  });
}

// Khách hàng: chi tiết 1 rạp kèm danh sách phòng đang active.
// Rạp inactive coi như không tồn tại với khách, trả 404.
export async function getCinemaById(id: number) {
  const cinema = await prisma.cinema.findFirst({
    where: { id, status: 'active' },
    include: {
      rooms: {
        where: { status: 'active' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      },
    },
  });
  if (!cinema) {
    throw new AppError('Không tìm thấy rạp', 404);
  }
  return cinema;
}

// Admin: thấy tất cả, kể cả inactive
export async function getAllCinemas() {
  return prisma.cinema.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function createCinema(input: CreateCinemaInput) {
  return prisma.cinema.create({
    data: { name: input.name, address: input.address },
  });
}

export async function updateCinema(id: number, input: UpdateCinemaInput) {
  // Chỉ cập nhật những trường thực sự được gửi lên
  // (bắt buộc vì tsconfig bật exactOptionalPropertyTypes)
  const data: Prisma.CinemaUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.address !== undefined) data.address = input.address;
  if (input.status !== undefined) data.status = input.status;

  try {
    return await prisma.cinema.update({ where: { id }, data });
  } catch (err) {
    // P2025: không tìm thấy rạp cần sửa
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new AppError('Không tìm thấy rạp', 404);
    }
    throw err;
  }
}

export async function deleteCinema(id: number) {
  try {
    await prisma.cinema.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy rạp', 404);
      }
      // P2003: vi phạm khóa ngoại, rạp đang có phòng chiếu
      // (quan hệ Room - Cinema là Restrict nên database tự chặn xóa)
      if (err.code === 'P2003') {
        throw new AppError('Rạp đang có phòng chiếu, hãy chuyển sang inactive thay vì xóa', 409);
      }
    }
    throw err;
  }
}
