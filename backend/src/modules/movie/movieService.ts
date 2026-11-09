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
  // true: lấy cả phim đã chiếu (trang quản trị). Mặc định chỉ lấy đang chiếu và sắp chiếu
  includeEnded?: boolean;
}

// Loại bỏ genreId trùng, tránh lỗi trùng khóa chính (movieId, genreId) ở bảng MovieGenre
function toMovieGenreRows(genreIds: number[]) {
  return [...new Set(genreIds)].map((genreId) => ({ genreId }));
}

// Trạng thái tính theo ngày khởi chiếu và ngày kết thúc:
// - qua ngày kết thúc (endDate < hôm nay): đã chiếu (ngày kết thúc vẫn còn chiếu)
// - đã tới ngày khởi chiếu: đang chiếu
// - chưa tới ngày khởi chiếu: sắp chiếu
function getMovieStatus(releaseDate: Date, endDate: Date | null): MovieStatus {
  const today = getTodayDate();
  if (endDate && endDate < today) return 'ended';
  return releaseDate <= today ? 'now_showing' : 'coming_soon';
}

// Cập nhật trạng thái phim theo ngày hiện tại.
// Chạy mỗi khi đọc danh sách/chi tiết phim thay vì dùng cron,
// cùng cách làm với việc tự nhả ghế hết hạn giữ (UC20).
async function syncMovieStatus() {
  const today = getTodayDate();
  await prisma.$transaction([
    // 1. Qua ngày kết thúc thì chuyển sang đã chiếu
    prisma.movie.updateMany({
      where: { status: { not: 'ended' }, endDate: { lt: today } },
      data: { status: 'ended' },
    }),
    // 2. Sắp chiếu đã tới ngày khởi chiếu thì chuyển sang đang chiếu
    prisma.movie.updateMany({
      where: {
        status: 'coming_soon',
        releaseDate: { lte: today },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      data: { status: 'now_showing' },
    }),
  ]);
}

export async function getMovies(filter: MovieFilter) {
  await syncMovieStatus();

  const where: Prisma.MovieWhereInput = {};
  if (filter.status !== undefined) {
    where.status = filter.status;
  } else if (!filter.includeEnded) {
    // Phía khách hàng: ẩn phim đã chiếu
    where.status = { not: 'ended' };
  }
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
    // Trạng thái tự tính theo ngày khởi chiếu và ngày kết thúc, admin không cần gửi
    status: getMovieStatus(input.releaseDate, input.endDate ?? null),
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
  // Lấy ngày khởi chiếu, ngày kết thúc hiện tại để tính lại trạng thái
  // khi admin chỉ sửa một trong hai ngày
  const current = await prisma.movie.findUnique({
    where: { id },
    select: { releaseDate: true, endDate: true },
  });
  if (!current) {
    throw new AppError('Không tìm thấy phim', 404);
  }

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
  if (input.releaseDate !== undefined) data.releaseDate = input.releaseDate;

  // Đổi ngày khởi chiếu hoặc ngày kết thúc thì tính lại trạng thái
  // (ví dụ gia hạn ngày kết thúc thì phim đã chiếu quay lại đang chiếu)
  if (input.releaseDate !== undefined || input.endDate !== undefined) {
    const releaseDate = input.releaseDate ?? current.releaseDate;
    const endDate = input.endDate ?? current.endDate;
    if (releaseDate) data.status = getMovieStatus(releaseDate, endDate);
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
