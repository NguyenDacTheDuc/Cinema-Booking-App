import { useSearchParams } from 'react-router'
import { getMovies } from '../api/movieApi'
import HeroCarousel from '../components/home/HeroCarousel'
import MovieSection from '../components/movie/MovieSection'
import { useFetch } from '../hooks/useFetch'

// Số phim trên banner: các phim đang chiếu mới thêm gần nhất (API trả phim mới thêm lên đầu)
const BANNER_SIZE = 4

function HomePage() {
  const [searchParams] = useSearchParams()
  const search = searchParams.get('search')?.trim() ?? ''

  const nowShowing = useFetch(() => getMovies({ status: 'now_showing' }), [])
  const comingSoon = useFetch(() => getMovies({ status: 'coming_soon' }), [])
  // Chỉ gọi API tìm kiếm khi trên URL có ?search=...
  const searchResult = useFetch(() => (search ? getMovies({ search }) : Promise.resolve(null)), [search])

  // Đang tìm kiếm: chỉ hiện kết quả
  if (search) {
    return (
      <div className="mx-auto max-w-7xl px-4">
        <MovieSection
          title={`Kết quả tìm kiếm: "${search}"`}
          movies={searchResult.data}
          loading={searchResult.loading}
          error={searchResult.error}
          emptyText="Không tìm thấy phim phù hợp"
        />
      </div>
    )
  }

  const bannerMovies = (nowShowing.data ?? []).slice(0, BANNER_SIZE)

  return (
    <div>
      <h1 className="sr-only">Cinema Booking - Đặt vé xem phim trực tuyến</h1>

      {/* Banner: đang tải thì giữ chỗ cho khỏi giật trang, chưa có phim đang chiếu thì hiện lời chào */}
      {nowShowing.loading && !nowShowing.data ? (
        <div className="bg-navy-pattern h-[560px] animate-pulse md:h-[520px]" />
      ) : bannerMovies.length > 0 ? (
        <HeroCarousel movies={bannerMovies} />
      ) : (
        <section className="bg-navy-pattern">
          <div className="mx-auto max-w-7xl px-4 pt-16 pb-28 text-center text-white md:pt-24 md:pb-32">
            <p className="text-lg font-semibold uppercase tracking-[0.3em] text-sky">Cinema Booking</p>
            <p className="mt-3 text-4xl font-bold md:text-5xl">Đặt vé xem phim trực tuyến</p>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Chọn phim, chọn ghế và nhận vé điện tử chỉ trong vài bước.
            </p>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4">
        <MovieSection
          title="Phim đang chiếu"
          movies={nowShowing.data}
          loading={nowShowing.loading}
          error={nowShowing.error}
        />
        <MovieSection
          title="Phim sắp chiếu"
          movies={comingSoon.data}
          loading={comingSoon.loading}
          error={comingSoon.error}
        />
      </div>
    </div>
  )
}

export default HomePage