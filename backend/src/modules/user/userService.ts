import prisma from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { UpdateUserStatusInput } from './userValidator';

// Admin: danh sách tài khoản khách hàng.
// Tài khoản admin được ẩn khỏi danh sách, và không bao giờ trả passwordHash.
export async function getAllUsers() {
  return prisma.user.findMany({
    where: { role: 'customer' },
    omit: { passwordHash: true },
    orderBy: { id: 'asc' },
  });
}

// Admin: khóa/mở tài khoản khách hàng
export async function updateUser(id: number, input: UpdateUserStatusInput) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }

  // Giao diện đã ẩn admin khỏi danh sách, nhưng backend vẫn phải chặn
  // vì API có thể bị gọi thẳng (Postman, lỗi frontend gửi nhầm id).
  // Tránh trường hợp khóa nhầm admin khiến không ai vào được trang quản trị.
  if (user.role === 'admin') {
    throw new AppError('Không thể thay đổi trạng thái tài khoản admin', 403);
  }

  return prisma.user.update({
    where: { id },
    data: { status: input.status },
    omit: { passwordHash: true },
  });
}
