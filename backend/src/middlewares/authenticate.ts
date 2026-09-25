import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/appError';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401);
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new AppError('Token không hợp lệ hoặc đã hết hạn', 401);
  }
}
