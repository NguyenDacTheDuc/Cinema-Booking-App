import axiosClient from './axiosClient'
import type { ApiResponse } from '../types/api'
import type { Movie, MovieFilter } from '../types/movie'

export async function getMovies(filter: MovieFilter = {}): Promise<Movie[]> {
  const res = await axiosClient.get<ApiResponse<Movie[]>>('/movies', { params: filter })
  return res.data.data
}

export async function getMovieById(id: number): Promise<Movie> {
  const res = await axiosClient.get<ApiResponse<Movie>>(`/movies/${id}`)
  return res.data.data
}
