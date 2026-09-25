import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/appError';

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(', ');
      throw new AppError(message, 400);
    }
    req.body = result.data;
    next();
  };
}
