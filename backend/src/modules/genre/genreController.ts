import { Request, Response } from 'express';
import * as genreService from './genreService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';

export async function getActiveGenres(_req: Request, res: Response) {
  const genres = await genreService.getActiveGenres();
  sendSuccess(res, genres);
}

export async function getAllGenres(_req: Request, res: Response) {
  const genres = await genreService.getAllGenres();
  sendSuccess(res, genres);
}

export async function createGenre(req: Request, res: Response) {
  const genre = await genreService.createGenre(req.body);
  sendSuccess(res, genre, 201);
}

export async function updateGenre(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const genre = await genreService.updateGenre(id, req.body);
  sendSuccess(res, genre);
}

export async function deleteGenre(req: Request, res: Response) {
  const id = parseId(req.params.id);
  await genreService.deleteGenre(id);
  sendSuccess(res, { message: 'Xóa thể loại thành công' });
}
