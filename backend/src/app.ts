import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import authRoute from './modules/auth/authRoute';
import genreRoute from './modules/genre/genreRoute';
import movieRoute from './modules/movie/movieRoute';
import seatTypeRoute from './modules/seatType/seatTypeRoute';
import cinemaRoute from './modules/cinema/cinemaRoute';
import userRoute from './modules/user/userRoute';
import roomRoute from './modules/room/roomRoute';
import seatRoute from './modules/seat/seatRoute';
import showtimeRoute from './modules/showtime/showtimeRoute';
import bookingRoute from './modules/booking/bookingRoute';
import dashboardRoute from './modules/dashboard/dashboardRoute';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use('/api/auth', authRoute);
app.use('/api', genreRoute);
app.use('/api/movies', movieRoute);
app.use('/api/seat-types', seatTypeRoute);
app.use('/api', cinemaRoute);
app.use('/api/users', userRoute);
app.use('/api', roomRoute);
app.use('/api', seatRoute);
app.use('/api/showtimes', showtimeRoute);
app.use('/api', bookingRoute);
app.use('/api/dashboard', dashboardRoute);
// errorHandler bắt buộc đặt sau cùng, sau mọi route
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
