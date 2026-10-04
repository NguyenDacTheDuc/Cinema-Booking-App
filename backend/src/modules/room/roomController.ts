import { Request, Response } from 'express';
import * as roomService from './roomService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';

export async function getActiveRooms(req: Request, res: Response) {
  const cinemaId = parseId(req.params.cinemaId);
  const rooms = await roomService.getActiveRooms(cinemaId);
  sendSuccess(res, rooms);
}

export async function getAllRooms(req: Request, res: Response) {
  const cinemaId = parseId(req.params.cinemaId);
  const rooms = await roomService.getAllRooms(cinemaId);
  sendSuccess(res, rooms);
}

export async function createRoom(req: Request, res: Response) {
  const room = await roomService.createRoom(req.body);
  sendSuccess(res, room, 201);
}

export async function updateRoom(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const room = await roomService.updateRoom(id, req.body);
  sendSuccess(res, room);
}

export async function deleteRoom(req: Request, res: Response) {
  const id = parseId(req.params.id);
  await roomService.deleteRoom(id);
  sendSuccess(res, { message: 'Xóa phòng thành công' });
}
