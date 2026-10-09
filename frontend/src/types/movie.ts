export type MovieStatus = 'coming_soon' | 'now_showing'

export interface Genre {
  id: number
  name: string
}

export interface Movie {
  id: number
  title: string
  description: string | null
  duration: number
  language: string | null
  director: string | null
  castList: string | null
  ageRating: string | null
  posterUrl: string | null
  trailerUrl: string | null
  releaseDate: string | null // dạng ISO, ví dụ "2026-09-25T00:00:00.000Z"
  endDate: string | null
  status: MovieStatus
  genres: { genre: Genre }[]
}

export interface MovieFilter {
  status?: MovieStatus
  search?: string
  genreId?: number
}
