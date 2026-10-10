import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router'
import { getActiveCinemas } from '../api/cinemaApi'
import { getMovies } from '../api/movieApi'
import { getShowtimes } from '../api/showtimeApi'
import { CalendarIcon } from '../components/icons/Icons'
import { useFetch } from '../hooks/useFetch'
import type { Showtime } from '../types/showtime'
import { getMoviePath, toSlug } from '../utils/slug'

const DAYS_TO_SHOW = 7
const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
// Khớp với quy định backend: ngừng giữ ghế trước giờ chiếu 15 phút
const BOOKING_CLOSE_MINUTES = 15

interface DayTab {
  value: string // "YYYY-MM-DD"
  weekday: string // "Hôm nay", "Thứ 2"...
  label: string // "12/10"
}

// 7 ngày kể từ hôm nay (theo giờ Việt Nam)
function getNextDays(): DayTab[] {
  const todayVN = new Date(Date.now() + 7 * 60 * 60 * 1000)
  return Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
    const date = new Date(
      Date.UTC(todayVN.getUTCFullYear(), todayVN.getUTCMonth(), todayVN.getUTCDate() + index),
    )
    const dd = String(date.getUTCDate()).padStart(2, '0')
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    return {
      value: date.toISOString().slice(0, 10),
      weekday: index === 0 ? 'Hôm nay' : WEEKDAYS[date.getUTCDay()],
      label: `${dd}/${mm}`,
    }
  })
}

// Suất đã qua hoặc sắp bắt đầu (còn dưới 15 phút) thì không đặt được nữa
function isBookingClosed(showtime: Showtime, now: number) {
  const start = new Date(`${showtime.showDate}T${showtime.startTime}:00+07:00`).getTime()
  return now > start - BOOKING_CLOSE_MINUTES * 60 * 1000
}

// Gom các suất chiếu theo phim, giữ thứ tự phim có suất sớm nhất lên trước
function groupByMovie(showtimes: Showtime[]) {
  const groups: { movie: Showtime['movie']; showtimes: Showtime[] }[] = []
  for (const showtime of showtimes) {
    const group = groups.find((item) => item.movie.id === showtime.movie.id)
    if (group) group.showtimes.push(showtime)
    else groups.push({ movie: showtime.movie, showtimes: [showtime] })
  }
  return groups
}

// Dùng cho 2 trang:
// - /showtimes: lịch chiếu tất cả phim (menu "Lịch chiếu")
// - /showtime/ten-phim: lịch chiếu của 1 phim (bấm "Mua vé" ở trang chủ hoặc trang chi tiết phim)
function ShowtimesPage() {
  const days = getNextDays()
  // Lưu rạp và ngày đang chọn trên URL (?cinema=1&date=2026-10-12) để F5 hoặc gửi link vẫn giữ nguyên
  const [searchParams, setSearchParams] = useSearchParams()
  const [now] = useState(() => Date.now())

  const { slug } = useParams()
  const location = useLocation()
  // Bấm "Mua vé": id và tên phim được gửi kèm ngầm (không hiện trên URL)
  const buyState = location.state as { movieId?: number; movieTitle?: string } | null
  const isMovieMode = Boolean(slug)

  // Phim đang xem lịch chiếu. Mở thẳng đường dẫn (không có id) thì tìm phim có tên không dấu trùng URL.
  // id = 0: không tìm thấy phim
  const { data: movieInfo } = useFetch(async () => {
    if (!slug) return null
    if (buyState?.movieId) return { id: buyState.movieId, title: buyState.movieTitle ?? '' }
    const movies = await getMovies()
    const found = movies.find((item) => toSlug(item.title) === slug)
    return found ? { id: found.id, title: found.title } : { id: 0, title: '' }
  }, [slug, buyState?.movieId])
  const movieId = movieInfo?.id

  const { data: cinemas, loading: loadingCinemas } = useFetch(() => getActiveCinemas(), [])

  const cinemaParam = Number(searchParams.get('cinema'))
  const cinemaId = cinemas?.some((cinema) => cinema.id === cinemaParam) ? cinemaParam : cinemas?.[0]?.id
  const dateParam = searchParams.get('date')
  const date = days.some((day) => day.value === dateParam) ? (dateParam as string) : days[0].value

  const { data: showtimes, loading, error } = useFetch(() => {
    if (!cinemaId) return Promise.resolve(null)
    if (!isMovieMode) return getShowtimes({ cinemaId, date })
    // Trang 1 phim: chờ biết id phim rồi mới gọi API
    return movieId ? getShowtimes({ movieId, cinemaId, date }) : Promise.resolve(null)
  }, [cinemaId, date, movieId])
  const groups = groupByMovie(showtimes ?? [])

  function select(next: { cinema?: number; date?: string }) {
    setSearchParams(
      { cinema: String(next.cinema ?? cinemaId ?? ''), date: next.date ?? date },
      // Giữ lại id phim đã gửi kèm khi đổi rạp, đổi ngày
      { replace: true, preventScrollReset: true, state: location.state },
    )
  }

  return (
    <div>
      {/* Khối tiêu đề, cùng kiểu với trang Giới thiệu */}
      <section className="bg-navy-pattern">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center text-white md:py-20">
          <p className="text-lg font-semibold uppercase tracking-[0.3em] text-sky">
            {isMovieMode ? 'Lịch chiếu' : 'Cinema Booking'}
          </p>
          <h1 className={`mt-3 text-4xl font-bold md:text-5xl ${isMovieMode ? 'uppercase' : ''}`}>
            {isMovieMode ? movieInfo?.title || '...' : 'Lịch chiếu'}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            {isMovieMode
              ? 'Chọn rạp, ngày và giờ chiếu phù hợp để đặt vé.'
              : 'Chọn rạp và ngày để xem các suất chiếu, đặt vé chỉ trong vài bước.'}
          </p>
          {isMovieMode && (
            <Link to="/showtimes" className="mt-5 inline-block text-sky hover:underline">
              Xem lịch chiếu tất cả phim
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {isMovieMode && movieId === 0 && (
          <div className="rounded-lg bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-xl font-semibold">Không tìm thấy phim</p>
            <Link to="/" className="mt-3 inline-block text-lg text-title hover:underline">
              Quay về trang chủ
            </Link>
          </div>
        )}

        {loadingCinemas && <p className="text-lg text-navy/60">Đang tải...</p>}
        {cinemas && cinemas.length === 0 && (
          <p className="rounded-lg bg-white p-10 text-center text-lg text-navy/60 shadow-sm">
            Hệ thống rạp đang được cập nhật.
          </p>
        )}

        {cinemas && cinemas.length > 0 && movieId !== 0 && (
          <>
            {/* Chọn rạp */}
            <div>
              <h2 className="text-lg font-semibold uppercase tracking-wide text-navy/60">Chọn rạp</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {cinemas.map((cinema) => {
                  const isActive = cinema.id === cinemaId
                  return (
                    <button
                      key={cinema.id}
                      type="button"
                      onClick={() => select({ cinema: cinema.id })}
                      className={`rounded-lg border-2 px-5 py-3 text-left transition ${
                        isActive
                          ? 'border-sky bg-sky text-white shadow-md'
                          : 'border-gray-200 bg-white hover:border-sky hover:text-title'
                      }`}
                    >
                      <span className="block text-lg font-bold">{cinema.name}</span>
                      <span className={`block text-sm ${isActive ? 'text-white/85' : 'text-navy/60'}`}>
                        {cinema.address}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chọn ngày: 7 ngày tới */}
            <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {days.map((day) => {
                const isActive = day.value === date
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => select({ date: day.value })}
                    className={`rounded-lg border-2 py-3 text-center transition ${
                      isActive
                        ? 'border-navy bg-navy text-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-navy'
                    }`}
                  >
                    <span className={`block text-sm ${isActive ? 'text-sky' : 'text-navy/60'}`}>{day.weekday}</span>
                    <span className="block text-xl font-bold">{day.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Danh sách phim và suất chiếu */}
            <div className="mt-8 space-y-4">
              {loading && !showtimes && <p className="text-lg text-navy/60">Đang tải...</p>}
              {!loading && error && <p className="text-lg text-red-600">{error}</p>}

              {showtimes && groups.length === 0 && (
                <div className="rounded-lg bg-white px-6 py-14 text-center shadow-sm">
                  <CalendarIcon className="mx-auto size-12 text-navy/30" />
                  <p className="mt-4 text-xl font-semibold">Chưa có suất chiếu</p>
                  <p className="mt-1 text-navy/60">
                    {isMovieMode
                      ? 'Phim chưa có suất chiếu tại rạp này trong ngày đã chọn, bạn vui lòng chọn ngày hoặc rạp khác.'
                      : 'Rạp chưa có lịch chiếu cho ngày này, bạn vui lòng chọn ngày khác.'}
                  </p>
                </div>
              )}

              {groups.map(({ movie, showtimes: movieShowtimes }) => {
                const detailUrl = getMoviePath(movie.title)
                const detailState = { movieId: movie.id }
                return (
                  <article key={movie.id} className="flex gap-5 rounded-lg bg-white p-4 shadow-sm sm:p-5">
                    <Link to={detailUrl} state={detailState} className="shrink-0 overflow-hidden rounded">
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          loading="lazy"
                          className="aspect-[2/3] w-24 object-cover transition duration-300 hover:scale-105 sm:w-32"
                        />
                      ) : (
                        <div className="flex aspect-[2/3] w-24 items-center justify-center bg-navy/10 text-center text-xs text-navy/50 sm:w-32">
                          Chưa có poster
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={detailUrl}
                          state={detailState}
                          className="text-xl font-bold uppercase text-title hover:text-sky"
                        >
                          {movie.title}
                        </Link>
                        {movie.ageRating && (
                          <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                            {movie.ageRating}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-navy/60">Thời lượng: {movie.duration} phút</p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {movieShowtimes.map((showtime) => {
                          const closed = isBookingClosed(showtime, now)
                                                    const timeContent = (
                            <>
                              <span className="block text-lg font-bold">{showtime.startTime}</span>
                              <span className="block text-xs opacity-75">~ {showtime.endTime}</span>
                            </>
                          )
                          // Suất đã hết giờ đặt vé: chỉ hiện mờ, không bấm được
                          return closed ? (
                            <span
                              key={showtime.id}
                              title="Đã hết thời gian đặt vé cho suất này"
                              className="min-w-24 cursor-not-allowed rounded border-2 border-gray-200 bg-gray-100 px-4 py-2 text-center text-navy/35"
                            >
                              {timeContent}
                            </span>
                          ) : (
                            // Bấm giờ chiếu: sang trang chọn ghế của suất đó
                            <Link
                              key={showtime.id}
                              to={`/booking/${showtime.id}`}
                              title={showtime.room.name}
                              className="min-w-24 rounded border-2 border-sky px-4 py-2 text-center transition hover:bg-sky hover:text-white"
                            >
                              {timeContent}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {showtimes && groups.length > 0 && (
              <p className="mt-6 text-sm text-navy/60">
                Suất chiếu ngừng nhận đặt vé trước giờ chiếu {BOOKING_CLOSE_MINUTES} phút. Giờ kết thúc là dự kiến.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ShowtimesPage