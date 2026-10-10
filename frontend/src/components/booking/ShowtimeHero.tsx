import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { getMoviePath } from '../../utils/slug'

// Chỉ cần các thông tin này, dùng được cho cả suất chiếu (GET /showtimes/:id) và đơn đặt vé
interface ShowtimeInfo {
  showDate: string // "YYYY-MM-DD"
  startTime: string
  endTime: string
  movie: { id: number; title: string; ageRating: string | null; posterUrl: string | null }
  room: { name: string; cinema: { name: string } }
}

interface ShowtimeHeroProps {
  eyebrow: string
  showtime: ShowtimeInfo
  children?: ReactNode // nhãn bên dưới (số ghế tối đa, thời gian giữ ghế...)
}

// "2026-10-10" -> "10/10/2026"
function formatShowDate(value: string) {
  return value.split('-').reverse().join('/')
}

// Khối đầu trang chọn ghế và thanh toán: poster, tên phim, thông tin suất chiếu
function ShowtimeHero({ eyebrow, showtime, children }: ShowtimeHeroProps) {
  const { movie, room } = showtime

  return (
    <section className="bg-navy-pattern text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-8 md:gap-8 md:py-10">
        {movie.posterUrl && (
          <Link to={getMoviePath(movie.title)} state={{ movieId: movie.id }} className="shrink-0">
            <img src={movie.posterUrl} alt={movie.title} className="aspect-[2/3] w-20 rounded object-cover shadow-lg md:w-28" />
          </Link>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold uppercase md:text-4xl">
            {movie.title}
            {movie.ageRating && (
              <span className="ml-3 rounded bg-red-600 px-2 py-0.5 align-middle text-sm font-bold">{movie.ageRating}</span>
            )}
          </h1>
          <p className="mt-2 text-lg text-white/85">
            {formatShowDate(showtime.showDate)} · {showtime.startTime} - {showtime.endTime} · {room.name} · {room.cinema.name}
          </p>
          {children}
        </div>
      </div>
    </section>
  )
}

export default ShowtimeHero