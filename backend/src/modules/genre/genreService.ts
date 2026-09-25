import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { CreateGenreInput, UpdateGenreInput } from './genreValidator';

// Khách hàng: chỉ thấy thể loại đang active
export async function getActiveGenres() {
  return prisma.genre.findMany({
    where: { status: 'active' },
    orderBy: { name: 'asc' },
  });
}

// Admin: thấy tất cả, kể cả inactive
export async function getAllGenres() {
  return prisma.genre.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function createGenre(input: CreateGenreInput) {
  try {
    return await prisma.genre.create({
      data: { name: input.name },
    });
  } catch (err) {
    // P2002: trùng tên (cột name có @unique)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Tên thể loại đã tồn tại', 409);
    }
    throw err;
  }
}

export async function updateGenre(id: number, input: UpdateGenreInput) {
  // Chỉ cập nhật những trường thực sự được gửi lên
  // (bắt buộc vì tsconfig bật exactOptionalPropertyTypes)
  const data: Prisma.GenreUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.status !== undefined) data.status = input.status;

  try {
    return await prisma.genre.update({ where: { id }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: không tìm thấy bản ghi cần sửa
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy thể loại', 404);
      }
      if (err.code === 'P2002') {
        throw new AppError('Tên thể loại đã tồn tại', 409);
      }
    }
    throw err;
  }
}

export async function deleteGenre(id: number) {
  try {
    await prisma.genre.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy thể loại', 404);
      }
      // P2003: vi phạm khóa ngoại, thể loại đang được phim sử dụng
      // (quan hệ MovieGenre mặc định Restrict nên database tự chặn xóa)
      if (err.code === 'P2003') {
        throw new AppError('Thể loại đang được phim sử dụng, hãy chuyển sang inactive thay vì xóa', 409);
      }
    }
    throw err;
  }
}
