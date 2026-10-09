import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/api';
import type { Movie, MovieFilter, MovieInput } from '../types/movie';

export async function getMovies(filter: MovieFilter = {}): Promise<Movie[]> {
  const res = await axiosClient.get<ApiResponse<Movie[]>>('/movies', { params: filter });
  return res.data.data;
}

export async function getMovieById(id: number): Promise<Movie> {
  const res = await axiosClient.get<ApiResponse<Movie>>(`/movies/${id}`);
  return res.data.data;
}

export async function createMovie(input: MovieInput): Promise<Movie> {
  const res = await axiosClient.post<ApiResponse<Movie>>('/movies', input);
  return res.data.data;
}

export async function updateMovie(id: number, input: MovieInput): Promise<Movie> {
  const res = await axiosClient.put<ApiResponse<Movie>>(`/movies/${id}`, input);
  return res.data.data;
}

export async function deleteMovie(id: number): Promise<void> {
  await axiosClient.delete(`/movies/${id}`);
}
