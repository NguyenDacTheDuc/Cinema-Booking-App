import { Request, Response } from 'express';
import * as authService from './authService';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 201);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  sendSuccess(res, result);
}

export async function logout(_req: Request, res: Response) {
  // MVP: không lưu danh sách token bị thu hồi ở server,
  // Frontend tự xóa token khi đăng xuất
  sendSuccess(res, { message: 'Đăng xuất thành công' });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);
  }
  const user = await authService.getProfile(req.user.userId);
  sendSuccess(res, user);
}

export async function updateMe(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);
  }
  const user = await authService.updateProfile(req.user.userId, req.body);
  sendSuccess(res, user);
}

export async function changePassword(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError('Vui lòng đăng nhập để tiếp tục', 401);
  }
  const result = await authService.changePassword(req.user.userId, req.body);
  sendSuccess(res, result);
}
