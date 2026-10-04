import { Request, Response } from 'express';
import * as userService from './userService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';

export async function getAllUsers(_req: Request, res: Response) {
  const users = await userService.getAllUsers();
  sendSuccess(res, users);
}

export async function updateUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const user = await userService.updateUser(id, req.body);
  sendSuccess(res, user);
}
