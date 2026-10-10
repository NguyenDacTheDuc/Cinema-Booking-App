import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Movie } from '../../types/movie'
import { formatDate } from '../../utils/format'
import { getMoviePath, getShowtimePath } from '../../utils/slug'
import { TicketIcon } from '../icons/Icons'

// Tự chuyển sang phim tiếp theo sau mỗi 3 giây
const AUTO_PLAY_MS = 3000

interface HeroCarouselProps {
  movies: Movie[]
}

function ArrowButton({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'Phim trước' : 'Phim tiếp theo'}
      className={`absolute top-1/2 z-20 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-navy/40 text-white backdrop-blur transition hover:border-sky hover:bg-sky md:flex ${
        direction === 'prev' ? 'left-4' : 'right-4'
      }`}
    >
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path d={direction === 'prev' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// Banner đầu trang chủ: các phim đang chiếu mới thêm gần nhất.
// Nền là poster làm mờ (cùng kiểu trang chi tiết phim), bên trái là thông tin, bên phải là poster.
function HeroCarousel({ movies }: HeroCarouselProps) {
  const [index, setIndex] = useState(0)
  // Rê chuột hoặc đang thao tác trong banner thì tạm dừng tự chuyển
  const [paused, setPaused] = useState(false)
  const total = movies.length

  useEffect(() => {
    if (paused || total < 2) return
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % total), AUTO_PLAY_MS)
    return () => window.clearTimeout(timer)
  }, [index, paused, total])

  function goTo(next: number) {
    setIndex((next + total) % total)
  }

  return (
    <section
      className="relative overflow-hidden bg-navy text-white"
      aria-roledescription="carousel"
      aria-label="Phim mới đang chiếu"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Các slide chồng lên nhau trong cùng 1 ô lưới: khung luôn cao bằng slide cao nhất, đổi slide không bị giật */}
      <div className="grid">
        {movies.map((movie, slideIndex) => {
          const active = slideIndex === index
          const genres = movie.genres.map((item) => item.genre.name).join(', ')
          const detailState = { movieId: movie.id }
          return (
            <div
              key={movie.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} / ${total}`}
              aria-hidden={!active}
              className={`relative col-start-1 row-start-1 transition-opacity duration-700 ${
                active ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              {/* Nền: poster làm mờ và lớp màu tối */}
              {movie.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/90 to-navy/50" />

              <div className="relative mx-auto flex max-w-7xl flex-col-reverse items-center gap-8 px-4 pt-10 pb-24 md:flex-row md:gap-12 md:px-20 md:pt-16 md:pb-28">
                {/* Thông tin phim */}
                <div className="min-w-0 flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <span className="rounded-full bg-sky px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
                      Phim mới
                    </span>
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      Đang chiếu
                    </span>
                    {movie.ageRating && (
                      <span className="rounded bg-red-600 px-2 py-0.5 text-sm font-bold">{movie.ageRating}</span>
                    )}
                  </div>

                  <h2 className="mt-4 text-3xl font-bold uppercase leading-tight md:text-5xl lg:text-6xl">{movie.title}</h2>

                  <p className="mt-4 text-lg text-white/80">
                    {[genres, `${movie.duration} phút`, movie.releaseDate && `Khởi chiếu ${formatDate(movie.releaseDate)}`]
                      .filter(Boolean)
                      .join('  ·  ')}
                  </p>

                  {movie.description && (
                    <p className="mt-4 hidden max-w-2xl text-lg leading-relaxed text-white/70 sm:line-clamp-3">
                      {movie.description}
                    </p>
                  )}

                  <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
                    <Link
                      to={getShowtimePath(movie.title)}
                      state={{ movieId: movie.id, movieTitle: movie.title }}
                      tabIndex={active ? 0 : -1}
                      className="inline-flex items-center gap-2 rounded bg-sky px-10 py-3 text-lg font-semibold text-white shadow-lg shadow-sky/30 transition hover:bg-sky-dark"
                    >
                      <TicketIcon className="size-6" />
                      Mua vé
                    </Link>
                    <Link
                      to={getMoviePath(movie.title)}
                      state={detailState}
                      tabIndex={active ? 0 : -1}
                      className="rounded border border-white/80 px-8 py-3 text-lg font-semibold transition hover:bg-white hover:text-navy"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>

                {/* Poster */}
                <Link to={getMoviePath(movie.title)} state={detailState} tabIndex={-1} className="shrink-0">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="aspect-[2/3] w-44 rounded-lg object-cover shadow-2xl ring-1 ring-white/20 sm:w-52 md:w-64 lg:w-72"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] w-44 items-center justify-center rounded-lg bg-white/10 text-white/50 sm:w-52 md:w-64 lg:w-72">
                      Chưa có poster
                    </div>
                  )}
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {total > 1 && (
        <>
          <ArrowButton direction="prev" onClick={() => goTo(index - 1)} />
          <ArrowButton direction="next" onClick={() => goTo(index + 1)} />

          {/* Chấm chuyển slide và số thứ tự */}
          <div className="absolute inset-x-0 bottom-14 z-20 flex items-center justify-center gap-4 md:bottom-16">
            <span className="font-mono text-sm text-white/70">
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <div className="flex gap-2">
              {movies.map((movie, dotIndex) => (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => goTo(dotIndex)}
                  aria-label={`Xem phim ${movie.title}`}
                  aria-current={dotIndex === index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIndex === index ? 'w-10 bg-sky' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default HeroCarousel