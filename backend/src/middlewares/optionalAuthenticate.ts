import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { verifyToken } from '../utils/jwt';

// Đăng nhập không bắt buộc (dùng cho route công khai):
// - Có token hợp lệ: gắn req.user giống authenticate
// - Không có token, token sai/hết hạn hoặc tài khoản bị khóa: coi như khách vãng lai, vẫn cho đi tiếp
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });
    if (user && user.status === 'active') {
      req.user = { userId: user.id, role: user.role };
    }
  } catch {
    // Token không hợp lệ: bỏ qua, xem như chưa đăng nhập
  }
  next();
}
