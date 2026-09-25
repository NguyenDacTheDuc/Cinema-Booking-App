import { AppError } from './appError';

export function parseId(value: string | string[] | undefined): number {
  if (typeof value !== 'string') {
    throw new AppError('Id không hợp lệ', 400);
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Id không hợp lệ', 400);
  }
  return id;
}
