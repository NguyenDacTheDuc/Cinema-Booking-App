import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/appError';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401);
  }

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401);
  }

  // Tra lại user trong database ở mỗi request, không tin hoàn toàn vào token:
  // - Tài khoản bị khóa thì chặn ngay, kể cả khi token vẫn còn hạn
  // - Role lấy từ database nên đổi quyền là có hiệu lực ngay
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, status: true },
  });

  if (!user) {
    throw new AppError('Tài khoản không tồn tại', 401);
  }
  if (user.status !== 'active') {
    throw new AppError('Tài khoản đã bị khóa', 403);
  }

  req.user = { userId: user.id, role: user.role };
  next();
}
