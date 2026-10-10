import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getMovies } from '../api/movieApi'
import HeroCarousel from '../components/home/HeroCarousel'
import { FilmIcon } from '../components/icons/Icons'
import MovieSection from '../components/movie/MovieSection'
import { useFetch } from '../hooks/useFetch'

// Số phim trên banner: các phim đang chiếu mới thêm gần nhất (API trả phim mới thêm lên đầu)
const BANNER_SIZE = 4

const iconProps = {
  className: 'size-7',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

// Lý do chọn Cinema Booking, khớp với các chức năng thật của hệ thống
const features: { title: string; text: ReactNode; icon: ReactNode }[] = [
  {
    title: 'Đặt vé nhanh chóng',
    text: 'Chọn phim, suất chiếu, ghế ngồi và thanh toán chỉ trong vài bước.',
    icon: (
      <svg {...iconProps}>
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    title: 'Chọn ghế trực quan',
    text: 'Sơ đồ ghế cập nhật liên tục, ghế bạn chọn được giữ trong 5 phút.',
    icon: (
      <svg {...iconProps}>
        <path d="M6 11V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" />
        <path d="M4 11h16v5H4zM6 16v4M18 16v4" />
      </svg>
    ),
  },
  {
    title: 'Vé điện tử QR',
    text: 'Nhận vé ngay sau khi thanh toán, đưa mã QR tại quầy là vào xem.',
    icon: (
      <svg {...iconProps}>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
      </svg>
    ),
  },
  {
    title: 'Giá vé minh bạch',
    text: (
      <>
        Đồng giá vé thường cho mọi suất chiếu.{' '}
        <Link to="/ticket-prices" className="font-semibold text-title hover:underline">
          Xem bảng giá
        </Link>
      </>
    ),
    icon: (
      <svg {...iconProps}>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="8" cy="8" r="1.5" />
      </svg>
    ),
  },
]

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