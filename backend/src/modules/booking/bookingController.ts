import { Request, Response } from 'express';
import * as bookingService from './bookingService';
import { sendSuccess } from '../../utils/apiResponse';
import { parseId } from '../../utils/parseId';

export async function getSeatMap(req: Request, res: Response) {
  const showtimeId = parseId(req.params.showtimeId);
  const seats = await bookingService.getSeatMap(showtimeId, req.user?.userId ?? null);
  sendSuccess(res, seats);
}

export async function lockSeats(req: Request, res: Response) {
  const userId = req.user!.userId;
  const showtimeId = parseId(req.params.showtimeId);
  const lock = await bookingService.lockSeats(userId, showtimeId, req.body);
  sendSuccess(res, lock);
}

export async function createBooking(req: Request, res: Response) {
  const userId = req.user!.userId;
  const booking = await bookingService.createBooking(userId, req.body);
  sendSuccess(res, booking, 201);
}

export async function getMyBookings(req: Request, res: Response) {
  const userId = req.user!.userId;
  const booking = await bookingService.getMyBookings(userId);
  sendSuccess(res, booking);
}

export async function getBookingById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  const booking = await bookingService.getBookingById(id, req.user!);
  sendSuccess(res, booking);
}

export async function getAllBookings(_req: Request, res: Response) {
  const bookings = await bookingService.getAllBookings();
  sendSuccess(res, bookings);
}
