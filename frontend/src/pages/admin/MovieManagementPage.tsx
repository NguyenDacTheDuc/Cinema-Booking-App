import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/axiosClient'
import { getAllGenres } from '../../api/genreApi'
import { createMovie, deleteMovie, getMovies, updateMovie } from '../../api/movieApi'
import Modal from '../../components/admin/Modal'
import { useFetch } from '../../hooks/useFetch'
import type { AdminGenre } from '../../types/genre'
import type { Movie, MovieInput } from '../../types/movie'
import { formatDate } from '../../utils/format'

// Phân loại độ tuổi phim chiếu rạp ở Việt Nam
const AGE_RATINGS = [
  { value: 'P', label: 'P - Mọi lứa tuổi' },
  { value: 'K', label: 'K - Dưới 13 tuổi cần người lớn đi kèm' },
  { value: 'T13', label: 'T13 - Từ 13 tuổi trở lên' },
  { value: 'T16', label: 'T16 - Từ 16 tuổi trở lên' },
  { value: 'T18', label: 'T18 - Từ 18 tuổi trở lên' },
]

// ======================= Ô chọn nhiều thể loại =======================

interface GenreMultiSelectProps {
  genres: AdminGenre[]
  value: number[] // id các thể loại đã chọn, theo thứ tự chọn
  onChange: (ids: number[]) => void
}

// Bấm vào ô thì hiện danh sách thể loại (cuộn được) để chọn, chọn xong hiện thành thẻ nằm ngang trong ô.
// Bấm vào thẻ để bỏ chọn. Thể loại đã chọn không hiện lại trong danh sách.
function GenreMultiSelect({ genres, value, onChange }: GenreMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Danh sách đang mở: bấm ra ngoài hoặc nhấn Esc thì đóng lại
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    // Bắt Esc trước Modal (tham số true) và chặn lại, để Esc chỉ đóng danh sách, không đóng cả khung thêm/sửa phim
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open])

  const selectedGenres = value
    .map((id) => genres.find((genre) => genre.id === id))
    .filter((genre) => genre !== undefined)
  // Chỉ cho chọn thể loại đang dùng và chưa được chọn
  const options = genres.filter((genre) => genre.status === 'active' && !value.includes(genre.id))

  return (
    <div ref={wrapperRef} className="relative">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((prev) => !prev)
          }
        }}
        className={`flex min-h-[50px] w-full cursor-pointer flex-wrap items-center gap-2 rounded border bg-white py-2 pl-4 pr-10 text-lg focus:outline-none ${
          open ? 'border-sky ring-2 ring-sky/40' : 'border-gray-300 focus:border-sky focus:ring-2 focus:ring-sky/40'
        }`}
      >
        {selectedGenres.length === 0 && <span className="text-gray-400">Chọn các thể loại phù hợp</span>}

        {selectedGenres.map((genre) => (
          <button
            key={genre.id}
            type="button"
            title="Bấm để bỏ chọn"
            onClick={(e) => {
              e.stopPropagation() // bỏ chọn thôi, không mở/đóng danh sách
              onChange(value.filter((id) => id !== genre.id))
            }}
            className="flex items-center gap-1.5 rounded-full bg-title/10 px-3 py-0.5 text-base font-semibold text-title transition hover:bg-red-100 hover:text-red-600"
          >
            {genre.name}
            {genre.status === 'inactive' && ' (ngừng dùng)'}
            <span aria-hidden="true">×</span>
          </button>
        ))}

        <svg
          className={`pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-navy/50 transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
        </svg>
      </div>

      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded border border-gray-200 bg-white py-1 shadow-lg">
          {options.length === 0 ? (
            <li className="px-4 py-2 text-navy/50">Đã chọn hết thể loại</li>
          ) : (
            options.map((genre) => (
              <li key={genre.id}>
                <button
                  type="button"
                  onClick={() => onChange([...value, genre.id])}
                  className="w-full px-4 py-2 text-left text-lg hover:bg-sky/10"
                >
                  {genre.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

// ======================= Form thêm / sửa =======================

const requiredText = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, `Tối đa ${max} ký tự`)

const movieSchema = z
  .object({
    title: requiredText('Vui lòng nhập tên phim', 200),
    description: z.string().trim().min(10, 'Mô tả phim phải có ít nhất 10 ký tự'),
    // Ô số để trống thì giá trị là NaN, zod báo "Vui lòng nhập thời lượng"
    duration: z
      .number('Vui lòng nhập thời lượng')
      .int('Thời lượng phải là số nguyên')
      .min(15, 'Thời lượng phim ít nhất 15 phút')
      .max(240, 'Thời lượng phim tối đa 240 phút'),
    language: requiredText('Vui lòng nhập ngôn ngữ', 50),
    director: requiredText('Vui lòng nhập tên đạo diễn', 150),
    castList: requiredText('Vui lòng nhập dàn diễn viên', 500),
    ageRating: z.string().min(1, 'Vui lòng chọn độ tuổi'),
    posterUrl: requiredText('Vui lòng nhập link poster', 500).pipe(z.url('Link poster không hợp lệ')),
    trailerUrl: requiredText('Vui lòng nhập link trailer', 500).pipe(z.url('Link trailer không hợp lệ')),
    genreIds: z.array(z.number()).min(1, 'Vui lòng chọn ít nhất 1 thể loại'),
    releaseDate: z.string().min(1, 'Vui lòng chọn ngày khởi chiếu'),
    endDate: z.string(), // để trống nếu chưa biết ngày ngừng chiếu
  })
  // Chuỗi "YYYY-MM-DD" so sánh trực tiếp được
  .refine((data) => data.endDate === '' || data.endDate >= data.releaseDate, {
    message: 'Ngày kết thúc phải từ ngày khởi chiếu trở đi',
    path: ['endDate'],
  })

type MovieForm = z.infer<typeof movieSchema>

// "2026-09-25T00:00:00.000Z" -> "2026-09-25" (giá trị cho ô chọn ngày)
function toDateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : ''
}

function getDefaultValues(movie: Movie | null): Partial<MovieForm> {
  if (!movie) {
    return {
      title: '',
      description: '',
      language: '',
      director: '',
      castList: '',
      ageRating: '',
      posterUrl: '',
      trailerUrl: '',
      genreIds: [],
      releaseDate: '',
      endDate: '',
    }
  }
  return {
    title: movie.title,
    description: movie.description ?? '',
    duration: movie.duration,
    language: movie.language ?? '',
    director: movie.director ?? '',
    castList: movie.castList ?? '',
    ageRating: movie.ageRating ?? '',
    posterUrl: movie.posterUrl ?? '',
    trailerUrl: movie.trailerUrl ?? '',
    genreIds: movie.genres.map((item) => item.genre.id),
    releaseDate: toDateInputValue(movie.releaseDate),
    endDate: toDateInputValue(movie.endDate),
  }
}

interface MovieFormModalProps {
  movie: Movie | null // null: thêm mới, có giá trị: sửa phim đó
  genres: AdminGenre[]
  onClose: () => void
  onSaved: () => void
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'
const labelClass = 'mb-1 block font-semibold'

function MovieFormModal({ movie, genres, onClose, onSaved }: MovieFormModalProps) {
  const isEditing = movie !== null
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MovieForm>({
    resolver: zodResolver(movieSchema),
    defaultValues: getDefaultValues(movie),
  })

  const posterUrl = useWatch({ control, name: 'posterUrl' })

  // Phim cũ có độ tuổi không nằm trong danh sách chuẩn thì vẫn giữ để không mất dữ liệu
  const ageOptions =
    movie?.ageRating && !AGE_RATINGS.some((item) => item.value === movie.ageRating)
      ? [...AGE_RATINGS, { value: movie.ageRating, label: movie.ageRating }]
      : AGE_RATINGS

  async function onSubmit(data: MovieForm) {
    setServerError(null)
    const { endDate, ...rest } = data
    // Không gửi endDate khi để trống (backend không bắt buộc)
    const input: MovieInput = endDate ? { ...rest, endDate } : rest
    try {
      if (isEditing) {
        await updateMovie(movie.id, input)
      } else {
        await createMovie(input)
      }
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title={isEditing ? 'Sửa phim' : 'Thêm phim'} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="movie-title" className={labelClass}>
            Tên phim
          </label>
          <input id="movie-title" type="text" autoFocus {...register('title')} className={inputClass} />
          {errors.title && <p className="mt-1 text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="movie-description" className={labelClass}>
            Mô tả
          </label>
          <textarea id="movie-description" rows={4} {...register('description')} className={inputClass} />
          {errors.description && <p className="mt-1 text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="movie-duration" className={labelClass}>
              Thời lượng (phút)
            </label>
            <input
              id="movie-duration"
              type="number"
              inputMode="numeric"
              min={15}
              max={240}
              {...register('duration', { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.duration && <p className="mt-1 text-red-600">{errors.duration.message}</p>}
          </div>

          <div>
            <label htmlFor="movie-age" className={labelClass}>
              Độ tuổi
            </label>
            <select id="movie-age" {...register('ageRating')} className={inputClass}>
              <option value="">-- Chọn độ tuổi --</option>
              {ageOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.ageRating && <p className="mt-1 text-red-600">{errors.ageRating.message}</p>}
          </div>

          <div>
            <label htmlFor="movie-language" className={labelClass}>
              Ngôn ngữ
            </label>
            <input
              id="movie-language"
              type="text"
              placeholder="Ví dụ: Tiếng Việt, Phụ đề tiếng Việt"
              {...register('language')}
              className={inputClass}
            />
            {errors.language && <p className="mt-1 text-red-600">{errors.language.message}</p>}
          </div>

          <div>
            <label htmlFor="movie-director" className={labelClass}>
              Đạo diễn
            </label>
            <input id="movie-director" type="text" {...register('director')} className={inputClass} />
            {errors.director && <p className="mt-1 text-red-600">{errors.director.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="movie-cast" className={labelClass}>
            Diễn viên
          </label>
          <input
            id="movie-cast"
            type="text"
            placeholder="Các diễn viên cách nhau bởi dấu phẩy"
            {...register('castList')}
            className={inputClass}
          />
          {errors.castList && <p className="mt-1 text-red-600">{errors.castList.message}</p>}
        </div>

        {/* Thể loại: bấm vào ô để mở danh sách, chọn được nhiều */}
        <div>
          <p className={labelClass}>Thể loại</p>
          <Controller
            name="genreIds"
            control={control}
            render={({ field }) => <GenreMultiSelect genres={genres} value={field.value} onChange={field.onChange} />}
          />
          {errors.genreIds && <p className="mt-1 text-red-600">{errors.genreIds.message}</p>}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="movie-release" className={labelClass}>
              Ngày khởi chiếu
            </label>
            <input id="movie-release" type="date" {...register('releaseDate')} className={inputClass} />
            {errors.releaseDate && <p className="mt-1 text-red-600">{errors.releaseDate.message}</p>}
          </div>

          <div>
            <label htmlFor="movie-end" className={labelClass}>
              Ngày kết thúc <span className="font-normal text-navy/60">(không bắt buộc)</span>
            </label>
            <input id="movie-end" type="date" {...register('endDate')} className={inputClass} />
            {errors.endDate && <p className="mt-1 text-red-600">{errors.endDate.message}</p>}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <div>
              <label htmlFor="movie-poster" className={labelClass}>
                Link poster
              </label>
              <input
                id="movie-poster"
                type="url"
                placeholder="https://..."
                {...register('posterUrl')}
                className={inputClass}
              />
              {errors.posterUrl && <p className="mt-1 text-red-600">{errors.posterUrl.message}</p>}
            </div>

            <div>
              <label htmlFor="movie-trailer" className={labelClass}>
                Link trailer
              </label>
              <input
                id="movie-trailer"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                {...register('trailerUrl')}
                className={inputClass}
              />
              {errors.trailerUrl && <p className="mt-1 text-red-600">{errors.trailerUrl.message}</p>}
            </div>
          </div>

          {/* Xem trước poster theo link vừa nhập */}
          <div className="flex h-40 w-28 items-center justify-center overflow-hidden rounded bg-gray-100 text-center text-sm text-navy/40">
            {posterUrl ? <img src={posterUrl} alt="Xem trước poster" className="h-full w-full object-cover" /> : 'Poster'}
          </div>
        </div>

        {serverError && <p className="text-red-600">{serverError}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-5 py-2 hover:bg-gray-100">
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-title px-5 py-2 font-semibold text-white transition hover:bg-navy disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ======================= Trang quản lý phim =======================

function MovieManagementPage() {
  // Tăng số này để tải lại danh sách sau khi thêm, sửa, xóa
  const [reloadKey, setReloadKey] = useState(0)
  const { data: movies, loading, error } = useFetch(() => getMovies(), [reloadKey])
  // Danh sách thể loại cho form (lấy cả thể loại ngừng dùng để hiện đúng thể loại cũ của phim)
  const { data: genres } = useFetch(() => getAllGenres(), [])

  const [keyword, setKeyword] = useState('')
  // undefined: form đang đóng; null: đang thêm mới; có giá trị: đang sửa phim đó
  const [formMovie, setFormMovie] = useState<Movie | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openForm(movie: Movie | null) {
    setActionError(null)
    setFormMovie(movie)
  }

  // Lưu xong: đóng form và tải lại bảng (không hiện thông báo, nhìn bảng là thấy thay đổi)
  function handleSaved() {
    setFormMovie(undefined)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete(movie: Movie) {
    if (!window.confirm(`Xóa phim "${movie.title}"?`)) return

    setActionError(null)
    setDeletingId(movie.id)
    try {
      await deleteMovie(movie.id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  // Tìm theo tên phim ngay trên trình duyệt (danh sách đã tải về đủ)
  const search = keyword.trim().toLowerCase()
  const rows = (movies ?? []).filter((movie) => movie.title.toLowerCase().includes(search))

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý phim</h1>
          <p className="mt-2 text-lg text-navy/70">Trạng thái phim tự cập nhật theo ngày khởi chiếu.</p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          disabled={!genres}
          className="rounded bg-title px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-navy disabled:opacity-60"
        >
          + Thêm phim
        </button>
      </div>

      <input
        type="search"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Tìm theo tên phim..."
        className="mt-6 w-full max-w-sm rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40"
      />

      {/* Chỉ báo lỗi (ví dụ xóa phim đã có suất chiếu); thành công thì không hiện gì */}
      {actionError && <p className="mt-4 rounded bg-red-50 px-4 py-3 text-red-600">{actionError}</p>}

      <div className="mt-4 overflow-x-auto rounded bg-white shadow-sm">
        {/* Chỉ hiện "Đang tải" lần đầu; khi tải lại vẫn giữ bảng cũ cho khỏi nháy */}
        {loading && !movies && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {movies && rows.length === 0 && (
          <p className="p-6 text-lg text-navy/60">{search ? 'Không tìm thấy phim phù hợp.' : 'Chưa có phim nào.'}</p>
        )}

        {rows.length > 0 && (
          <table className="w-full min-w-[1000px] text-left">
            <thead className="whitespace-nowrap bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Poster</th>
                <th className="px-4 py-3 font-semibold">Tên phim</th>
                <th className="px-4 py-3 font-semibold">Thời lượng</th>
                <th className="px-4 py-3 font-semibold">Khởi chiếu</th>
                <th className="px-4 py-3 font-semibold">Kết thúc</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((movie, index) => {
                const isShowing = movie.status === 'now_showing'
                return (
                  <tr key={movie.id} className="border-t border-gray-200 hover:bg-cream">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="h-16 w-12 overflow-hidden rounded bg-gray-100">
                        {movie.posterUrl && (
                          <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">
                        {movie.title}
                        {movie.ageRating && (
                          <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-700">
                            {movie.ageRating}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-navy/60">{movie.genres.map((item) => item.genre.name).join(', ')}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{movie.duration} phút</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(movie.releaseDate)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{movie.endDate ? formatDate(movie.endDate) : '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${
                          isShowing ? 'bg-green-100 text-green-700' : 'bg-sky/15 text-title'
                        }`}
                      >
                        {isShowing ? 'Đang chiếu' : 'Sắp chiếu'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openForm(movie)}
                          disabled={!genres}
                          className="rounded border border-title px-4 py-1.5 text-title transition hover:bg-title hover:text-white disabled:opacity-50"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(movie)}
                          disabled={deletingId === movie.id}
                          className="rounded border border-red-500 px-4 py-1.5 text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          {deletingId === movie.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {formMovie !== undefined && genres && (
        <MovieFormModal movie={formMovie} genres={genres} onClose={() => setFormMovie(undefined)} onSaved={handleSaved} />
      )}
    </div>
  )
}

export default MovieManagementPage