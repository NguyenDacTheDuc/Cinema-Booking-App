import type { Movie } from '../../types/movie'
import { FilmIcon } from '../icons/Icons'
import MovieCard from './MovieCard'

interface MovieSectionProps {
  title: string
  movies: Movie[] | null
  loading: boolean
  error: string | null
  emptyText?: string
}

// Một khối phim có tiêu đề: "Phim đang chiếu", "Phim sắp chiếu", "Kết quả tìm kiếm"
function MovieSection({ title, movies, loading, error, emptyText = 'Hiện chưa có phim nào' }: MovieSectionProps) {
  return (
    <section className="py-10">
      {/* Tiêu đề: gạch chân đậm dưới chữ, nối với đường kẻ xanh chạy hết chiều ngang */}
      <div className="border-b-2 border-sky">
        <h2 className="-mb-0.5 inline-flex items-center gap-2 border-b-[3px] border-navy pb-3 text-3xl font-bold uppercase md:text-4xl">
          <FilmIcon className="size-10" />
          {title}
        </h2>
      </div>

      <div className="mt-10">
        {loading && <p className="text-lg text-navy/60">Đang tải...</p>}

        {!loading && error && <p className="text-lg text-red-600">{error}</p>}

        {!loading && !error && movies?.length === 0 && <p className="text-lg text-navy/60">{emptyText}</p>}

        {!loading && !error && movies && movies.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default MovieSection
