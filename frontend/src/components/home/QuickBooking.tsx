import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { getActiveCinemas } from '../../api/cinemaApi'
import { useFetch } from '../../hooks/useFetch'
import type { Movie } from '../../types/movie'
import { getShowtimePath } from '../../utils/slug'
import { TicketIcon } from '../icons/Icons'

const DAYS_TO_SHOW = 7
const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

// 7 ngày kể từ hôm nay (giờ Việt Nam), giống thanh chọn ngày ở trang Lịch chiếu
function getNextDays() {
  const todayVN = new Date(Date.now() + 7 * 60 * 60 * 1000)
  return Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
    const date = new Date(Date.UTC(todayVN.getUTCFullYear(), todayVN.getUTCMonth(), todayVN.getUTCDate() + index))
    const dd = String(date.getUTCDate()).padStart(2, '0')
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    return {
      value: date.toISOString().slice(0, 10),
      label: `${index === 0 ? 'Hôm nay' : WEEKDAYS[date.getUTCDay()]}, ${dd}/${mm}`,
    }
  })
}

const selectClass =
  'w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

// Thanh "Mua vé nhanh" dưới banner: chọn phim, rạp, ngày rồi sang trang lịch chiếu đã lọc sẵn
function QuickBooking({ movies }: { movies: Movie[] }) {
  const navigate = useNavigate()
  const [days] = useState(getNextDays)
  const { data: cinemas } = useFetch(() => getActiveCinemas(), [])

  const [movieId, setMovieId] = useState('')
  const [cinemaId, setCinemaId] = useState('')
  const [date, setDate] = useState(days[0].value)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ date })
    if (cinemaId) params.set('cinema', cinemaId)

    const movie = movies.find((item) => item.id === Number(movieId))
    if (movie) {
      // Lịch chiếu của riêng phim đã chọn, id và tên phim gửi kèm ngầm như nút "Mua vé"
      navigate(`${getShowtimePath(movie.title)}?${params}`, { state: { movieId: movie.id, movieTitle: movie.title } })
    } else {
      navigate(`/showtimes?${params}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border-t-4 border-sky bg-white p-5 shadow-xl md:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="flex items-center gap-3 md:col-span-2 lg:col-span-1 lg:self-center lg:pr-2">
        <span className="flex size-12 items-center justify-center rounded-full bg-sky/15 text-title">
          <TicketIcon className="size-6" />
        </span>
        <div>
          <p className="text-xl font-bold uppercase">Mua vé nhanh</p>
          <p className="text-sm text-navy/60">Chỉ vài bước để có vé</p>
        </div>
      </div>

      <div>
        <label htmlFor="quick-movie" className="mb-1 block text-sm font-semibold text-navy/70">
          Phim
        </label>
        <select id="quick-movie" value={movieId} onChange={(e) => setMovieId(e.target.value)} className={selectClass}>
          <option value="">Tất cả phim</option>
          {movies.map((movie) => (
            <option key={movie.id} value={movie.id}>
              {movie.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="quick-cinema" className="mb-1 block text-sm font-semibold text-navy/70">
          Rạp
        </label>
        <select id="quick-cinema" value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} className={selectClass}>
          <option value="">Tất cả rạp</option>
          {(cinemas ?? []).map((cinema) => (
            <option key={cinema.id} value={cinema.id}>
              {cinema.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="quick-date" className="mb-1 block text-sm font-semibold text-navy/70">
          Ngày
        </label>
        <select id="quick-date" value={date} onChange={(e) => setDate(e.target.value)} className={selectClass}>
          {days.map((day) => (
            <option key={day.value} value={day.value}>
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded bg-title px-8 py-3 text-lg font-semibold whitespace-nowrap text-white transition hover:bg-navy md:col-span-2 lg:col-span-1"
      >
        Xem suất chiếu
      </button>
    </form>
  )
}

export default QuickBooking