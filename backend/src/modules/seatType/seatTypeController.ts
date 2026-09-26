import { Request, Response } from 'express';
import * as seatTypeService from './seatTypeService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';

export async function getSeatTypes(_req: Request, res: Response) {
  const seatTypes = await seatTypeService.getSeatTypes();
  sendSuccess(res, seatTypes);
}

export async function createSeatType(req: Request, res: Response) {
  const seatType = await seatTypeService.createSeatType(req.body);
  sendSuccess(res, seatType, 201);
}

export async function updateSeatType(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const seatType = await seatTypeService.updateSeatType(id, req.body);
  sendSuccess(res, seatType);
}

export async function deleteSeatType(req: Request, res: Response) {
  const id = parseId(req.params.id);
  await seatTypeService.deleteSeatType(id);
  sendSuccess(res, { message: 'Xóa loại ghế thành công' });
}
