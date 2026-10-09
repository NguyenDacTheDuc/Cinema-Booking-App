import { useSearchParams } from 'react-router'
import { getMovies } from '../api/movieApi'
import MovieSection from '../components/movie/MovieSection'
import { useFetch } from '../hooks/useFetch'

function HomePage() {
  const [searchParams] = useSearchParams()
  const search = searchParams.get('search')?.trim() ?? ''

  const nowShowing = useFetch(() => getMovies({ status: 'now_showing' }), [])
  const comingSoon = useFetch(() => getMovies({ status: 'coming_soon' }), [])
  // Chỉ gọi API tìm kiếm khi trên URL có ?search=...
  const searchResult = useFetch(() => (search ? getMovies({ search }) : Promise.resolve(null)), [search])

  return (
    <div className="mx-auto max-w-7xl px-4">
      {search ? (
        <MovieSection
          title={`Kết quả tìm kiếm: "${search}"`}
          movies={searchResult.data}
          loading={searchResult.loading}
          error={searchResult.error}
          emptyText="Không tìm thấy phim phù hợp"
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}

export default HomePage
