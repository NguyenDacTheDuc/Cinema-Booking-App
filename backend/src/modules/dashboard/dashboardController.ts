import { Request, Response } from 'express';
import * as dashboardService from './dashboardService';
import { sendSuccess } from '../../utils/apiResponse';

export async function getDashboard(_req: Request, res: Response) {
  const dashboard = await dashboardService.getDashboard();
  sendSuccess(res, dashboard);
}
