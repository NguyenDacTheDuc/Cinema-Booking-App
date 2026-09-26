import { Request, Response } from 'express';
import * as cinemaService from './cinemaService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';

export async function getActiveCinemas(_req: Request, res: Response) {
  const cinemas = await cinemaService.getActiveCinemas();
  sendSuccess(res, cinemas);
}

export async function getCinemaById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const cinema = await cinemaService.getCinemaById(id);
  sendSuccess(res, cinema);
}

export async function getAllCinemas(_req: Request, res: Response) {
  const cinemas = await cinemaService.getAllCinemas();
  sendSuccess(res, cinemas);
}

export async function createCinema(req: Request, res: Response) {
  const cinema = await cinemaService.createCinema(req.body);
  sendSuccess(res, cinema, 201);
}

export async function updateCinema(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const cinema = await cinemaService.updateCinema(id, req.body);
  sendSuccess(res, cinema);
}

export async function deleteCinema(req: Request, res: Response) {
  const id = parseId(req.params.id);
  await cinemaService.deleteCinema(id);
  sendSuccess(res, { message: 'Xóa rạp thành công' });
}
