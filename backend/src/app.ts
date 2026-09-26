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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api', genreRoute);
app.use('/api/movies', movieRoute);
app.use('/api/seat-types', seatTypeRoute);
app.use('/api', cinemaRoute);

// errorHandler bắt buộc đặt sau cùng, sau mọi route
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
