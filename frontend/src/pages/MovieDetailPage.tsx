import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { getMovieById, getMovies } from '../api/movieApi'
import MovieSection from '../components/movie/MovieSection'
import { useFetch } from '../hooks/useFetch'
import { formatDate } from '../utils/format'
import { getShowtimePath, toSlug } from '../utils/slug'

// Ý nghĩa các mức phân loại độ tuổi
const AGE_LABELS: Record<string, string> = {
  P: 'Phim dành cho mọi lứa tuổi',
  K: 'Khán giả dưới 13 tuổi cần có người lớn đi kèm',
  T13: 'Phim dành cho khán giả từ 13 tuổi trở lên',
  T16: 'Phim dành cho khán giả từ 16 tuổi trở lên',
  T18: 'Phim dành cho khán giả từ 18 tuổi trở lên',
}

// Link YouTube (watch?v=, youtu.be/, shorts/, embed/) -> link nhúng để phát ngay trên trang.
// Không phải YouTube thì trả về null, khi đó mở trailer ở tab mới
function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const link = new URL(url)
    let videoId: string | null = null
    if (link.hostname.includes('youtu.be')) {
      videoId = link.pathname.slice(1)
    } else if (link.hostname.includes('youtube.com')) {
      videoId = link.searchParams.get('v') ?? link.pathname.match(/^\/(embed|shorts)\/([^/?]+)/)?.[2] ?? null
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null
  } catch {
    return null
  }
}

// Khung xem trailer nổi giữa màn hình. Đóng khi bấm X, bấm ra ngoài hoặc nhấn Esc
function TrailerModal({ embedUrl, title, onClose }: { embedUrl: string; title: string; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={`Trailer ${title}`} className="w-full max-w-4xl">
        <div className="mb-2 flex items-center justify-between text-white">
          <p className="truncate text-lg font-semibold">Trailer: {title}</p>
          <button type="button" onClick={onClose} className="px-2 text-3xl leading-none hover:text-sky" aria-label="Đóng">
            ×
          </button>
        </div>
        <iframe
          src={embedUrl}
          title={`Trailer ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded bg-black"
        />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-white/60">{label}:</dt>
      <dd className="font-semibold">{value || 'Đang cập nhật'}</dd>
    </div>
  )
}

function MovieDetailPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  // Bấm vào poster hoặc tên phim: id được gửi kèm ngầm (không hiện trên URL)
  const movieId = (location.state as { movieId?: number } | null)?.movieId

  const {
    data: movie,
    loading,
    error,
  } = useFetch(async () => {
    if (movieId) return getMovieById(movieId)
    // Mở thẳng đường dẫn (dán link, mở tab mới) nên không có id: tìm phim có tên không dấu trùng với URL
    const movies = await getMovies()
    return movies.find((item) => toSlug(item.title) === slug) ?? null
  }, [slug, movieId])

  // Các phim đang chiếu khác, hiện ở cuối trang
  const nowShowing = useFetch(() => getMovies({ status: 'now_showing' }), [])
  const otherMovies = (nowShowing.data ?? []).filter((item) => item.id !== movie?.id).slice(0, 6)

  const [showTrailer, setShowTrailer] = useState(false)

  // Bấm sang phim khác ở cuối trang: cuộn lên đầu
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (loading && !movie) {
    return <p className="mx-auto max-w-7xl px-4 py-16 text-lg text-navy/60">Đang tải...</p>
  }

  if (error || !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-2xl font-bold">{error ?? 'Không tìm thấy phim'}</p>
        <Link to="/" className="mt-4 inline-block text-lg text-title hover:underline">
          Quay về trang chủ
        </Link>
      </div>
    )
  }

  const genres = movie.genres.map((item) => item.genre.name).join(', ')
  const embedUrl = movie.trailerUrl ? getYoutubeEmbedUrl(movie.trailerUrl) : null
  const isNowShowing = movie.status === 'now_showing'

  return (
    <div>
      {/* Khối đầu trang: nền là poster làm mờ, phủ lớp màu tối */}
      <section className="relative overflow-hidden bg-navy text-white">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full scale-110 object-cover opacity-30 blur-2xl"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/90 to-navy/60" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
          <p className="text-white/60">
            <Link to="/" className="hover:text-sky">
              Trang chủ
            </Link>{' '}
            / <span className="text-white">{movie.title}</span>
          </p>

          <div className="mt-6 flex flex-col gap-8 md:flex-row">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="mx-auto aspect-[2/3] w-56 shrink-0 rounded-lg object-cover shadow-2xl md:mx-0 md:w-72"
              />
            ) : (
              <div className="mx-auto flex aspect-[2/3] w-56 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/50 md:mx-0 md:w-72">
                Chưa có poster
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    isNowShowing ? 'bg-green-500 text-white' : 'bg-amber-400 text-navy'
                  }`}
                >
                  {isNowShowing ? 'Đang chiếu' : 'Sắp chiếu'}
                </span>
                {movie.ageRating && (
                  <span className="rounded bg-red-600 px-2 py-0.5 text-sm font-bold">{movie.ageRating}</span>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-bold uppercase leading-tight md:text-4xl">{movie.title}</h1>

              <dl className="mt-6 space-y-3 text-lg">
                <InfoRow label="Thể loại" value={genres} />
                <InfoRow label="Thời lượng" value={`${movie.duration} phút`} />
                <InfoRow label="Đạo diễn" value={movie.director} />
                <InfoRow label="Diễn viên" value={movie.castList} />
                <InfoRow label="Khởi chiếu" value={formatDate(movie.releaseDate)} />
                <InfoRow label="Ngôn ngữ" value={movie.language} />
              </dl>

              {movie.ageRating && AGE_LABELS[movie.ageRating] && (
                <p className="mt-5 inline-block rounded border border-red-500/60 bg-red-600/15 px-4 py-2 text-white/90">
                  <span className="font-bold">{movie.ageRating}:</span> {AGE_LABELS[movie.ageRating]}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                {movie.trailerUrl &&
                  (embedUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowTrailer(true)}
                      className="border border-white px-8 py-3 text-lg font-semibold transition hover:bg-white hover:text-navy"
                    >
                      Xem trailer
                    </button>
                  ) : (
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-white px-8 py-3 text-lg font-semibold transition hover:bg-white hover:text-navy"
                    >
                      Xem trailer
                    </a>
                  ))}
                {/* Sang trang lịch chiếu của riêng phim này, id và tên phim gửi kèm ngầm */}
                <Link
                  to={getShowtimePath(movie.title)}
                  state={{ movieId: movie.id, movieTitle: movie.title }}
                  className="border border-sky bg-sky px-10 py-3 text-lg font-semibold text-white transition hover:bg-sky-dark"
                >
                  Mua vé
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {/* Nội dung phim */}
        <section className="pt-10">
          <div className="border-b-2 border-sky">
            <h2 className="-mb-0.5 inline-block border-b-[3px] border-navy pb-3 text-2xl font-bold uppercase md:text-3xl">
              Nội dung phim
            </h2>
          </div>
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-navy/80">
            {movie.description || 'Nội dung phim đang được cập nhật.'}
          </p>
        </section>

        {otherMovies.length > 0 && (
          <MovieSection title="Phim đang chiếu khác" movies={otherMovies} loading={false} error={null} />
        )}
      </div>

      {showTrailer && embedUrl && (
        <TrailerModal embedUrl={embedUrl} title={movie.title} onClose={() => setShowTrailer(false)} />
      )}
    </div>
  )
}

export default MovieDetailPage