// Suất chiếu (GET /showtimes)
export interface Showtime {
  id: number;
  movieId: number;
  roomId: number;
  showDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm", backend tự tính theo thời lượng phim
  status: 'scheduled' | 'ended';
  movie: { id: number; title: string; duration: number; ageRating: string | null; posterUrl: string | null };
  room: { id: number; name: string; cinema: { id: number; name: string } };
}

// Lọc danh sách: không gửi date thì backend trả các suất từ hôm nay trở đi
export interface ShowtimeFilter {
  date?: string; // "YYYY-MM-DD"
  cinemaId?: number;
  movieId?: number;
}

export interface CreateShowtimeInput {
  movieId: number;
  roomId: number;
  showDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
}

// Sửa suất chiếu: chỉ đổi được ngày và giờ bắt đầu
export interface UpdateShowtimeInput {
  showDate: string;
  startTime: string;
}
