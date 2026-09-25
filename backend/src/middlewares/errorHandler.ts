import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra ở server' });
}
