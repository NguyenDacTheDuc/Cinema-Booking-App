// ended: đã chiếu (qua ngày kết thúc), chỉ trang quản trị mới thấy
export type MovieStatus = 'coming_soon' | 'now_showing' | 'ended';

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  language: string | null;
  director: string | null;
  castList: string | null;
  ageRating: string | null;
  posterUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string | null; // dạng ISO, ví dụ "2026-09-25T00:00:00.000Z"
  endDate: string | null;
  status: MovieStatus;
  genres: { genre: Genre }[];
}

export interface MovieFilter {
  status?: MovieStatus;
  search?: string;
  genreId?: number;
  includeEnded?: boolean; // true: lấy cả phim đã chiếu (trang quản trị)
}

// Dữ liệu admin gửi lên khi thêm/sửa phim (trạng thái backend tự tính theo ngày khởi chiếu và ngày kết thúc)
export interface MovieInput {
  title: string;
  description: string;
  duration: number;
  language: string;
  director: string;
  castList: string;
  ageRating: string;
  posterUrl: string;
  trailerUrl: string;
  genreIds: number[];
  releaseDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD", không gửi nếu chưa biết ngày ngừng chiếu
}
