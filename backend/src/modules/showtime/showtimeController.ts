import { Request, Response } from 'express';
import * as showtimeService from './showtimeService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';
import { AppError } from '../../utils/appError';

export async function getShowtimes(req: Request, res: Response) {
  const { movieId, cinemaId, date } = req.query;
  const filter: showtimeService.ShowtimeFilter = {};

  if (movieId !== undefined) {
    filter.movieId = parseId(typeof movieId === 'string' ? movieId : undefined);
  }
  if (cinemaId !== undefined) {
    filter.cinemaId = parseId(typeof cinemaId === 'string' ? cinemaId : undefined);
  }
  if (date !== undefined) {
    if (typeof date !== 'string') {
      throw new AppError('Ngày chiếu không hợp lệ (định dạng YYYY-MM-DD, ví dụ 2026-10-10)', 400);
    }
    filter.date = date;
  }

  const showtimes = await showtimeService.getShowtimes(filter);
  sendSuccess(res, showtimes);
}

export async function getShowtimeById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const showtime = await showtimeService.getShowtimeById(id);
  sendSuccess(res, showtime);
}

export async function createShowtime(req: Request, res: Response) {
  const showtime = await showtimeService.createShowtime(req.body);
  sendSuccess(res, showtime, 201);
}

export async function updateShowtime(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const showtime = await showtimeService.updateShowtime(id, req.body);
  sendSuccess(res, showtime);
}

export async function deleteShowtime(req: Request, res: Response) {
  const id = parseId(req.params.id);
  await showtimeService.deleteShowtime(id);
  sendSuccess(res, { message: 'Xóa suất chiếu thành công' });
}
