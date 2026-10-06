import { Prisma, MovieStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../utils/appError';
import { CreateMovieInput, UpdateMovieInput } from './movieValidator';
import { getTodayDate } from '../../utils/getTodayDate';

// Kèm danh sách thể loại (chỉ lấy id, name) mỗi khi trả phim về
const movieInclude = {
  genres: {
    select: {
      genre: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.MovieInclude;

export interface MovieFilter {
  status?: MovieStatus;
  search?: string;
  genreId?: number;
}

// Loại bỏ genreId trùng, tránh lỗi trùng khóa chính (movieId, genreId) ở bảng MovieGenre
function toMovieGenreRows(genreIds: number[]) {
  return [...new Set(genreIds)].map((genreId) => ({ genreId }));
}

// Ngày hôm nay theo giờ Việt Nam (UTC+7), đưa về 00:00 UTC
// để so sánh đúng với cột releaseDate kiểu DATE (không có giờ).
// Nếu dùng thẳng new Date() thì từ 0h đến 7h sáng giờ Việt Nam
// server vẫn tính là ngày hôm trước (vì giờ UTC chậm hơn 7 tiếng).

// Đã tới ngày khởi chiếu thì là đang chiếu, chưa tới thì là sắp chiếu
function getStatusByReleaseDate(releaseDate: Date): MovieStatus {
  return releaseDate <= getTodayDate() ? 'now_showing' : 'coming_soon';
}

// Chuyển các phim sắp chiếu đã tới ngày khởi chiếu sang đang chiếu.
// Chạy mỗi khi đọc danh sách/chi tiết phim thay vì dùng cron,
// cùng cách làm với việc tự nhả ghế hết hạn giữ (UC20).
async function syncMovieStatus() {
  await prisma.movie.updateMany({
    where: {
      status: 'coming_soon',
      releaseDate: { lte: getTodayDate() },
    },
    data: { status: 'now_showing' },
  });
}

export async function getMovies(filter: MovieFilter) {
  await syncMovieStatus();

  const where: Prisma.MovieWhereInput = {};
  if (filter.status !== undefined) where.status = filter.status;
  // MySQL collation utf8mb4_0900_ai_ci nên contains đã không phân biệt hoa thường
  if (filter.search !== undefined) where.title = { contains: filter.search };
  if (filter.genreId !== undefined) where.genres = { some: { genreId: filter.genreId } };

  return prisma.movie.findMany({
    where,
    include: movieInclude,
    orderBy: { id: 'desc' },
  });
}

export async function getMovieById(id: number) {
  await syncMovieStatus();

  const movie = await prisma.movie.findUnique({
    where: { id },
    include: movieInclude,
  });
  if (!movie) {
    throw new AppError('Không tìm thấy phim', 404);
  }
  return movie;
}

export async function createMovie(input: CreateMovieInput) {
  const data: Prisma.MovieCreateInput = {
    title: input.title,
    description: input.description,
    duration: input.duration,
    language: input.language,
    director: input.director,
    castList: input.castList,
    ageRating: input.ageRating,
    posterUrl: input.posterUrl,
    trailerUrl: input.trailerUrl,
    releaseDate: input.releaseDate,
    // Trạng thái tự tính theo ngày khởi chiếu, admin không cần gửi
    status: getStatusByReleaseDate(input.releaseDate),
    // Tạo phim và các dòng MovieGenre trong cùng 1 lệnh (Prisma tự bọc transaction)
    genres: { create: toMovieGenreRows(input.genreIds) },
  };
  // endDate không bắt buộc, chưa biết ngày ngừng chiếu thì để trống
  if (input.endDate !== undefined) data.endDate = input.endDate;

  try {
    return await prisma.movie.create({ data, include: movieInclude });
  } catch (err) {
    // P2003: genreId không tồn tại trong bảng Genre
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new AppError('Thể loại không tồn tại', 400);
    }
    throw err;
  }
}

export async function updateMovie(id: number, input: UpdateMovieInput) {
  // Chỉ cập nhật những trường thực sự được gửi lên
  // (bắt buộc vì tsconfig bật exactOptionalPropertyTypes)
  const data: Prisma.MovieUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.duration !== undefined) data.duration = input.duration;
  if (input.language !== undefined) data.language = input.language;
  if (input.director !== undefined) data.director = input.director;
  if (input.castList !== undefined) data.castList = input.castList;
  if (input.ageRating !== undefined) data.ageRating = input.ageRating;
  if (input.posterUrl !== undefined) data.posterUrl = input.posterUrl;
  if (input.trailerUrl !== undefined) data.trailerUrl = input.trailerUrl;
  if (input.endDate !== undefined) data.endDate = input.endDate;

  // Đổi ngày khởi chiếu thì tính lại trạng thái theo ngày mới
  if (input.releaseDate !== undefined) {
    data.releaseDate = input.releaseDate;
    data.status = getStatusByReleaseDate(input.releaseDate);
  }

  // Có gửi genreIds thì thay toàn bộ danh sách thể loại cũ bằng danh sách mới,
  // không gửi thì giữ nguyên
  if (input.genreIds !== undefined) {
    data.genres = {
      deleteMany: {},
      create: toMovieGenreRows(input.genreIds),
    };
  }

  try {
    return await prisma.movie.update({ where: { id }, data, include: movieInclude });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: không tìm thấy phim cần sửa
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy phim', 404);
      }
      if (err.code === 'P2003') {
        throw new AppError('Thể loại không tồn tại', 400);
      }
    }
    throw err;
  }
}

export async function deleteMovie(id: number) {
  try {
    // Phải xóa các dòng MovieGenre trước vì quan hệ là Restrict.
    // Gói chung 1 transaction: nếu xóa phim thất bại (còn Showtime)
    // thì các dòng MovieGenre vừa xóa cũng được khôi phục lại.
    await prisma.$transaction([prisma.movieGenre.deleteMany({ where: { movieId: id } }), prisma.movie.delete({ where: { id } })]);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new AppError('Không tìm thấy phim', 404);
      }
      // P2003: phim vẫn còn Showtime tham chiếu (quan hệ Restrict)
      if (err.code === 'P2003') {
        throw new AppError('Phim đã có suất chiếu, không thể xóa', 409);
      }
    }
    throw err;
  }
}
