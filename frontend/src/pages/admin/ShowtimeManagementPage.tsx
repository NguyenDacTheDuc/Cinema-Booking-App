import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/axiosClient'
import { getAllCinemas } from '../../api/cinemaApi'
import { getMovies } from '../../api/movieApi'
import { getRoomsByCinema } from '../../api/roomApi'
import { createShowtime, deleteShowtime, getShowtimes, updateShowtime } from '../../api/showtimeApi'
import Modal from '../../components/admin/Modal'
import { useFetch } from '../../hooks/useFetch'
import type { Cinema } from '../../types/cinema'
import type { Movie } from '../../types/movie'
import type { Showtime } from '../../types/showtime'
import { formatDate } from '../../utils/format'

// ======================= Hàm hỗ trợ =======================

// Ngày hôm nay theo giờ Việt Nam dạng "YYYY-MM-DD"
function getTodayString() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// "19:30" + 125 phút -> "21:35"
function addMinutes(time: string, minutes: number) {
  const [hours = 0, mins = 0] = time.split(':').map(Number)
  const total = hours * 60 + mins + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Trạng thái hiển thị theo giờ hiện tại (backend chỉ có scheduled/ended)
type ShowtimeState = 'upcoming' | 'showing' | 'ended'

function getShowtimeState(showtime: Showtime): ShowtimeState {
  if (showtime.status === 'ended') return 'ended'
  const start = new Date(`${showtime.showDate}T${showtime.startTime}:00+07:00`).getTime()
  const end = new Date(`${showtime.showDate}T${showtime.endTime}:00+07:00`).getTime()
  const now = Date.now()
  if (now < start) return 'upcoming'
  if (now < end) return 'showing'
  return 'ended'
}

const stateStyles: Record<ShowtimeState, { label: string; className: string }> = {
  upcoming: { label: 'Sắp chiếu', className: 'bg-sky/15 text-title' },
  showing: { label: 'Đang chiếu', className: 'bg-green-100 text-green-700' },
  ended: { label: 'Đã chiếu', className: 'bg-gray-200 text-gray-600' },
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'
const labelClass = 'mb-1 block font-semibold'

const showDateField = z.string().min(1, 'Vui lòng chọn ngày chiếu')
const startTimeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Vui lòng chọn giờ bắt đầu')

// ======================= Form thêm suất chiếu =======================

const createSchema = z.object({
  movieId: z.string().min(1, 'Vui lòng chọn phim'),
  cinemaId: z.string().min(1, 'Vui lòng chọn rạp'),
  roomId: z.string().min(1, 'Vui lòng chọn phòng'),
  showDate: showDateField,
  startTime: startTimeField,
})

type CreateForm = z.infer<typeof createSchema>

interface CreateShowtimeModalProps {
  movies: Movie[]
  cinemas: Cinema[]
  defaultDate: string
  onClose: () => void
  onSaved: () => void
}

function CreateShowtimeModal({ movies, cinemas, defaultDate, onClose, onSaved }: CreateShowtimeModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { movieId: '', cinemaId: '', roomId: '', showDate: defaultDate, startTime: '' },
  })

  const movieId = useWatch({ control, name: 'movieId' })
  const cinemaId = useWatch({ control, name: 'cinemaId' })
  const startTime = useWatch({ control, name: 'startTime' })

  // Chọn rạp xong mới tải danh sách phòng của rạp đó
  const { data: rooms, loading: loadingRooms } = useFetch(
    () => (cinemaId ? getRoomsByCinema(Number(cinemaId)) : Promise.resolve([])),
    [cinemaId],
  )
  const activeRooms = (rooms ?? []).filter((room) => room.status === 'active')

  const selectedMovie = movies.find((movie) => movie.id === Number(movieId))

  async function onSubmit(data: CreateForm) {
    setServerError(null)
    try {
      await createShowtime({
        movieId: Number(data.movieId),
        roomId: Number(data.roomId),
        showDate: data.showDate,
        startTime: data.startTime,
      })
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title="Thêm suất chiếu" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="showtime-movie" className={labelClass}>
            Phim
          </label>
          <select id="showtime-movie" {...register('movieId')} className={inputClass}>
            <option value="">-- Chọn phim --</option>
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>
                {movie.title} ({movie.duration} phút)
              </option>
            ))}
          </select>
          {errors.movieId && <p className="mt-1 text-red-600">{errors.movieId.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="showtime-cinema" className={labelClass}>
              Rạp
            </label>
            {/* Đổi rạp thì bỏ phòng đã chọn của rạp cũ */}
            <select
              id="showtime-cinema"
              {...register('cinemaId', { onChange: () => setValue('roomId', '') })}
              className={inputClass}
            >
              <option value="">-- Chọn rạp --</option>
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>
                  {cinema.name}
                </option>
              ))}
            </select>
            {errors.cinemaId && <p className="mt-1 text-red-600">{errors.cinemaId.message}</p>}
          </div>

          <div>
            <label htmlFor="showtime-room" className={labelClass}>
              Phòng
            </label>
            <select id="showtime-room" {...register('roomId')} disabled={!cinemaId} className={`${inputClass} disabled:bg-gray-100`}>
              <option value="">{!cinemaId ? 'Chọn rạp trước' : loadingRooms ? 'Đang tải...' : '-- Chọn phòng --'}</option>
              {activeRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room._count.seats} ghế)
                </option>
              ))}
            </select>
            {errors.roomId && <p className="mt-1 text-red-600">{errors.roomId.message}</p>}
          </div>

          <div>
            <label htmlFor="showtime-date" className={labelClass}>
              Ngày chiếu
            </label>
            <input id="showtime-date" type="date" min={getTodayString()} {...register('showDate')} className={inputClass} />
            {errors.showDate && <p className="mt-1 text-red-600">{errors.showDate.message}</p>}
          </div>

          <div>
            <label htmlFor="showtime-start" className={labelClass}>
              Giờ bắt đầu
            </label>
            <input id="showtime-start" type="time" {...register('startTime')} className={inputClass} />
            {errors.startTime && <p className="mt-1 text-red-600">{errors.startTime.message}</p>}
          </div>
        </div>

        {/* Giờ kết thúc backend tự tính theo thời lượng phim, hiện trước cho admin xem */}
        {selectedMovie && startTime && (
          <p className="rounded bg-cream px-4 py-3 text-navy/70">
            Suất chiếu kết thúc lúc <span className="font-semibold text-navy">{addMinutes(startTime, selectedMovie.duration)}</span>{' '}
            (phim dài {selectedMovie.duration} phút). Các suất cùng phòng cần cách nhau ít nhất 15 phút để dọn phòng.
          </p>
        )}

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
            {isSubmitting ? 'Đang tạo...' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ======================= Form sửa suất chiếu =======================

const editSchema = z.object({
  showDate: showDateField,
  startTime: startTimeField,
})

type EditForm = z.infer<typeof editSchema>

interface EditShowtimeModalProps {
  showtime: Showtime
  onClose: () => void
  onSaved: () => void
}

function EditShowtimeModal({ showtime, onClose, onSaved }: EditShowtimeModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { showDate: showtime.showDate, startTime: showtime.startTime },
  })

  const startTime = useWatch({ control, name: 'startTime' })

  async function onSubmit(data: EditForm) {
    setServerError(null)
    try {
      await updateShowtime(showtime.id, data)
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title="Sửa suất chiếu" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Phim và phòng không đổi được, chỉ hiện để xem */}
        <div className="rounded bg-cream px-4 py-3">
          <p className="font-semibold">{showtime.movie.title}</p>
          <p className="text-navy/70">
            {showtime.room.cinema.name} - {showtime.room.name}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="showtime-date" className={labelClass}>
              Ngày chiếu
            </label>
            <input id="showtime-date" type="date" min={getTodayString()} {...register('showDate')} className={inputClass} />
            {errors.showDate && <p className="mt-1 text-red-600">{errors.showDate.message}</p>}
          </div>

          <div>
            <label htmlFor="showtime-start" className={labelClass}>
              Giờ bắt đầu
            </label>
            <input id="showtime-start" type="time" {...register('startTime')} className={inputClass} />
            {errors.startTime && <p className="mt-1 text-red-600">{errors.startTime.message}</p>}
          </div>
        </div>

        {startTime && (
          <p className="text-navy/70">
            Kết thúc lúc <span className="font-semibold text-navy">{addMinutes(startTime, showtime.movie.duration)}</span> (phim dài{' '}
            {showtime.movie.duration} phút). Suất đã có người đặt vé thì không sửa được.
          </p>
        )}

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
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ======================= Trang quản lý suất chiếu =======================

const filterClass =
  'rounded border border-gray-300 bg-white px-3 py-2 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

function ShowtimeManagementPage() {
  // Bộ lọc: mặc định xem suất chiếu hôm nay; xóa ngày thì xem tất cả từ hôm nay trở đi
  const [date, setDate] = useState(getTodayString())
  const [cinemaId, setCinemaId] = useState('')
  const [movieId, setMovieId] = useState('')

  // Tăng số này để tải lại danh sách sau khi thêm, sửa, xóa
  const [reloadKey, setReloadKey] = useState(0)
  const { data: showtimes, loading, error } = useFetch(
    () =>
      getShowtimes({
        ...(date && { date }),
        ...(cinemaId && { cinemaId: Number(cinemaId) }),
        ...(movieId && { movieId: Number(movieId) }),
      }),
    [date, cinemaId, movieId, reloadKey],
  )

  const { data: movies } = useFetch(() => getMovies(), [])
  const { data: cinemas } = useFetch(() => getAllCinemas(), [])
  // Form thêm chỉ cho chọn phim chưa hết thời gian chiếu và rạp đang hoạt động
  const today = getTodayString()
  const schedulableMovies = (movies ?? []).filter((movie) => !movie.endDate || movie.endDate.slice(0, 10) >= today)
  const activeCinemas = (cinemas ?? []).filter((cinema) => cinema.status === 'active')

  // 'new': đang thêm; Showtime: đang sửa suất đó; null: không mở form
  const [formShowtime, setFormShowtime] = useState<Showtime | 'new' | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openForm(showtime: Showtime | 'new') {
    setActionError(null)
    setFormShowtime(showtime)
  }

  // Lưu xong: đóng form và tải lại bảng (không hiện thông báo, nhìn bảng là thấy thay đổi)
  function handleSaved() {
    setFormShowtime(null)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete(showtime: Showtime) {
    if (!window.confirm(`Xóa suất ${showtime.startTime} ngày ${formatDate(showtime.showDate)} của phim "${showtime.movie.title}"?`)) return

    setActionError(null)
    setDeletingId(showtime.id)
    try {
      await deleteShowtime(showtime.id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const rows = showtimes ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý suất chiếu</h1>
          <p className="mt-2 text-lg text-navy/70">Giờ kết thúc tự tính theo thời lượng phim.</p>
        </div>
        <button
          type="button"
          onClick={() => openForm('new')}
          disabled={!movies || !cinemas}
          className="rounded bg-title px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-navy disabled:opacity-60"
        >
          + Thêm suất chiếu
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={filterClass} aria-label="Ngày chiếu" />
        <select value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} className={filterClass} aria-label="Rạp">
          <option value="">Tất cả rạp</option>
          {(cinemas ?? []).map((cinema) => (
            <option key={cinema.id} value={cinema.id}>
              {cinema.name}
            </option>
          ))}
        </select>
        <select value={movieId} onChange={(e) => setMovieId(e.target.value)} className={`${filterClass} max-w-xs`} aria-label="Phim">
          <option value="">Tất cả phim</option>
          {(movies ?? []).map((movie) => (
            <option key={movie.id} value={movie.id}>
              {movie.title}
            </option>
          ))}
        </select>
        {date && (
          <button type="button" onClick={() => setDate('')} className="text-title hover:underline">
            Xem tất cả từ hôm nay
          </button>
        )}
      </div>

      {/* Chỉ báo lỗi (ví dụ xóa suất đã có người đặt vé); thành công thì không hiện gì */}
      {actionError && <p className="mt-4 rounded bg-red-50 px-4 py-3 text-red-600">{actionError}</p>}

      <div className="mt-4 overflow-x-auto rounded bg-white shadow-sm">
        {/* Chỉ hiện "Đang tải" lần đầu; khi tải lại vẫn giữ bảng cũ cho khỏi nháy */}
        {loading && !showtimes && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {showtimes && rows.length === 0 && <p className="p-6 text-lg text-navy/60">Không có suất chiếu nào.</p>}

        {rows.length > 0 && (
          <table className="w-full min-w-[950px] text-left">
            <thead className="whitespace-nowrap bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Ngày chiếu</th>
                <th className="px-4 py-3 font-semibold">Giờ chiếu</th>
                <th className="px-4 py-3 font-semibold">Phim</th>
                <th className="px-4 py-3 font-semibold">Rạp</th>
                <th className="px-4 py-3 font-semibold">Phòng</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((showtime, index) => {
                const state = getShowtimeState(showtime)
                const style = stateStyles[state]
                return (
                  <tr key={showtime.id} className="border-t border-gray-200 hover:bg-cream">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(showtime.showDate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">
                      {showtime.startTime} - {showtime.endTime}
                    </td>
                    <td className="px-4 py-3">{showtime.movie.title}</td>
                    <td className="px-4 py-3">{showtime.room.cinema.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{showtime.room.name}</td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${style.className}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Suất đã bắt đầu thì không sửa, xóa được nữa */}
                      {state === 'upcoming' ? (
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openForm(showtime)}
                            className="rounded border border-title px-4 py-1.5 text-title transition hover:bg-title hover:text-white"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(showtime)}
                            disabled={deletingId === showtime.id}
                            className="rounded border border-red-500 px-4 py-1.5 text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                          >
                            {deletingId === showtime.id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-center text-navy/40">—</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {formShowtime === 'new' && movies && cinemas && (
        <CreateShowtimeModal
          movies={schedulableMovies}
          cinemas={activeCinemas}
          defaultDate={date > today ? date : today}
          onClose={() => setFormShowtime(null)}
          onSaved={handleSaved}
        />
      )}
      {formShowtime !== null && formShowtime !== 'new' && (
        <EditShowtimeModal showtime={formShowtime} onClose={() => setFormShowtime(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}

export default ShowtimeManagementPage