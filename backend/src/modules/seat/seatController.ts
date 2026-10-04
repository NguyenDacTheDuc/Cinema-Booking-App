import { Request, Response } from 'express';
import * as seatService from './seatService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';

export async function getSeatsByRoom(req: Request, res: Response) {
  const roomId = parseId(req.params.roomId);
  const seats = await seatService.getSeatsByRoom(roomId);
  sendSuccess(res, seats);
}

export async function updateSeat(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const seat = await seatService.updateSeat(id, req.body);
  sendSuccess(res, seat);
}
