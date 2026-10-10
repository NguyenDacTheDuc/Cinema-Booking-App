import { Link } from 'react-router'
import type { Movie } from '../../types/movie'
import { formatDate } from '../../utils/format'
import { getMoviePath, getShowtimePath } from '../../utils/slug'

interface MovieCardProps {
  movie: Movie
}

function MovieCard({ movie }: MovieCardProps) {
  // URL chỉ hiện tên phim không dấu, còn id được gửi kèm ngầm (state) để trang chi tiết gọi API /movies/:id
  const detailUrl = getMoviePath(movie.title)
  const detailState = { movieId: movie.id }

  return (
    <article className="flex flex-col">
      <Link to={detailUrl} state={detailState} className="block overflow-hidden">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            loading="lazy"
            className="aspect-[2/3] w-full object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center bg-navy/10 text-navy/50">
            Chưa có poster
          </div>
        )}
      </Link>

      <Link to={detailUrl} state={detailState} className="mt-3 text-xl uppercase leading-snug text-title hover:text-sky">
        {movie.title}
      </Link>
      <p className="mt-2">Khởi chiếu: {formatDate(movie.releaseDate)}</p>
      <p className="mt-1">Thời lượng: {movie.duration} phút</p>

      {/* mt-auto đẩy nút xuống đáy để các nút thẳng hàng dù tên phim dài ngắn khác nhau */}
      <div className="mt-auto pt-6 text-center">
        {/* Sang trang lịch chiếu của riêng phim này, id và tên phim gửi kèm ngầm */}
        <Link
          to={getShowtimePath(movie.title)}
          state={{ movieId: movie.id, movieTitle: movie.title }}
          className="inline-block border border-sky px-8 py-2.5 text-sky transition hover:bg-sky hover:text-white"
        >
          Mua Vé
        </Link>
      </div>
    </article>
  )
}

export default MovieCard