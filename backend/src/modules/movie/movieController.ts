import { Request, Response } from 'express';
import * as movieService from './movieService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';
import { AppError } from '../../utils/appError';

// GET /movies?status=&search=&genreId=
// Query không đi qua middleware validate (req.query trong Express 5 là chỉ đọc),
// nên đọc và kiểm tra đơn giản ngay tại đây
export async function getMovies(req: Request, res: Response) {
  const { status, search, genreId } = req.query;
  const filter: movieService.MovieFilter = {};

  if (status !== undefined) {
    if (status !== 'coming_soon' && status !== 'now_showing') {
      throw new AppError('Trạng thái phim không hợp lệ', 400);
    }
    filter.status = status;
  }

  if (typeof search === 'string' && search.trim() !== '') {
    filter.search = search.trim();
  }

  if (genreId !== undefined) {
    filter.genreId = parseId(typeof genreId === 'string' ? genreId : undefined);
  }

  const movies = await movieService.getMovies(filter);
  sendSuccess(res, movies);
}

export async function getMovieById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const movie = await movieService.getMovieById(id);
  sendSuccess(res, movie);
}

export async function createMovie(req: Request, res: Response) {
  const movie = await movieService.createMovie(req.body);
  sendSuccess(res, movie, 201);
}

export async function updateMovie(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const movie = await movieService.updateMovie(id, req.body);
  sendSuccess(res, movie);
}

export async function deleteMovie(req: Request, res: Response) {
  const id = parseId(req.params.id);
  await movieService.deleteMovie(id);
  sendSuccess(res, { message: 'Xóa phim thành công' });
}
