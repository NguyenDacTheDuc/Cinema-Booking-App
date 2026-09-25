import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    throw new AppError('Bạn không có quyền thực hiện thao tác này', 403);
  }
  next();
}
