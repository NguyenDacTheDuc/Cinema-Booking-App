import { Router } from 'express';
import * as bookingController from './bookingController';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { createBookingSchema, lockSeatsSchema } from './bookingValidator';
import { requireAdmin } from '../../middlewares/authorization';

const router = Router();

router.get('/showtimes/:showtimeId/seats', bookingController.getSeatMap);
router.post('/showtimes/:showtimeId/seats/lock', authenticate, validate(lockSeatsSchema), bookingController.lockSeats);
router.post('/bookings', authenticate, validate(createBookingSchema), bookingController.createBooking);
router.get('/bookings/me', authenticate, bookingController.getMyBookings);
router.get('/bookings/:id', authenticate, bookingController.getBookingById);
router.get('/bookings', authenticate, requireAdmin, bookingController.getAllBookings);

export default router;
