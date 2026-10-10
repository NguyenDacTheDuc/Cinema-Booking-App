import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { getErrorMessage } from '../api/axiosClient'
import { getSeatMap, lockSeats } from '../api/bookingApi'
import { getSeatTypes } from '../api/seatTypeApi'
import { getShowtimeById } from '../api/showtimeApi'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import type { SeatMapItem } from '../types/booking'
import { formatMoney } from '../utils/format'
import { getMoviePath } from '../utils/slug'

const MAX_SEATS = 8
// Khớp với quy định backend: ngừng bán vé trực tuyến trước giờ chiếu 15 phút
const BOOKING_CLOSE_MINUTES = 15
// Tự tải lại sơ đồ ghế để thấy ghế người khác vừa giữ hoặc vừa nhả
const REFRESH_SECONDS = 5

// Màu theo loại ghế, cùng thứ tự với trang quản trị sơ đồ ghế (loại thường đứng đầu)
const SEAT_TYPE_COLORS = [
  'bg-gray-200 text-navy hover:bg-gray-300',
  'bg-amber-400 text-white hover:bg-amber-500',
  'bg-rose-500 text-white hover:bg-rose-600',
  'bg-violet-500 text-white hover:bg-violet-600',
  'bg-emerald-500 text-white hover:bg-emerald-600',
  'bg-sky-600 text-white hover:bg-sky-700',
]
const MINE_CLASS = 'bg-sky text-white ring-2 ring-sky-dark ring-offset-1'
const HELD_BY_OTHERS_CLASS =
  'cursor-not-allowed bg-[repeating-linear-gradient(45deg,#cbd5e1_0_4px,#e2e8f0_4px_8px)] text-navy/40'
const BOOKED_CLASS = 'cursor-not-allowed bg-navy/75 text-white/50'

// Thời điểm hiện tại (dùng trong các hàm xử lý sự kiện)
function getTimestamp() {
  return Date.now()
}

// "2026-10-10" -> "10/10/2026"
function formatShowDate(value: string) {
  return value.split('-').reverse().join('/')
}

function getSeatLabel(seat: { rowLabel: string; columnNumber: number }) {
  return `${seat.rowLabel}${seat.columnNumber}`
}

// Thông báo nổi giữa màn hình (ghế bị người khác giữ, hết thời gian giữ ghế...)
function NoticeModal({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl">
        <p className="text-xl font-bold">{title}</p>
        <p className="mt-3 text-navy/70">{message}</p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-6 rounded bg-title px-8 py-2.5 font-semibold text-white transition hover:bg-navy"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  )
}

// Trang chọn ghế của 1 suất chiếu: /booking/:showtimeId
function BookingPage() {
  const showtimeId = Number(useParams().showtimeId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: showtime, loading: loadingShowtime, error: showtimeError } = useFetch(
    () => getShowtimeById(showtimeId),
    [showtimeId],
  )
  const { data: seatTypes } = useFetch(() => getSeatTypes(), [])

  // Tải lại sơ đồ ghế mỗi 5 giây (tăng tick để gọi lại API).
  // Ghi lại thời điểm bắt đầu gọi để biết dữ liệu này cũ hay mới so với lần giữ ghế gần nhất.
  const [tick, setTick] = useState(0)
  const { data: seatData, error: seatError } = useFetch(async () => {
    const startedAt = Date.now()
    const seats = await getSeatMap(showtimeId)
    return { seats, startedAt }
  }, [showtimeId, tick, user?.id])

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), REFRESH_SECONDS * 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Đồng hồ 1 giây/lần cho đếm ngược và kiểm tra hết giờ đặt vé
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Kết quả giữ ghế vừa xong: hiện ngay, không chờ lần tải sơ đồ ghế tiếp theo
  const [override, setOverride] = useState<{ seatIds: number[]; lockedUntil: string | null; at: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)

  const seats = seatData?.seats ?? []
  const useOverride = override !== null && (saving || override.at > (seatData?.startedAt ?? 0))
  const mySeatIds = useOverride ? override.seatIds : seats.filter((seat) => seat.isMine).map((seat) => seat.id)
  const lockedUntil = useOverride ? override.lockedUntil : (seats.find((seat) => seat.isMine)?.lockedUntil ?? null)
  const mySeats = seats.filter((seat) => mySeatIds.includes(seat.id))
  const totalAmount = mySeats.reduce((sum, seat) => sum + Number(seat.seatType.price), 0)

  const startAt = showtime ? new Date(`${showtime.showDate}T${showtime.startTime}:00+07:00`).getTime() : 0
  const salesClosed = showtime !== null && now >= startAt - BOOKING_CLOSE_MINUTES * 60 * 1000
  const secondsLeft = lockedUntil ? Math.max(0, Math.floor((new Date(lockedUntil).getTime() - now) / 1000)) : null
  const holdActive = mySeatIds.length > 0 && secondsLeft !== null && secondsLeft > 0

  // Hẹn giờ đúng lúc hết hạn giữ ghế: báo cho khách và tải lại sơ đồ (backend tự nhả ghế hết hạn)
  const hasSeats = mySeatIds.length > 0
  useEffect(() => {
    if (!hasSeats || !lockedUntil) return
    const timer = window.setTimeout(
      () => {
        setOverride(null)
        setNotice({ title: 'Hết thời gian giữ ghế', message: 'Các ghế bạn chọn đã được nhả ra, vui lòng chọn lại.' })
        setTick((value) => value + 1)
      },
      Math.max(new Date(lockedUntil).getTime() - Date.now(), 0),
    )
    return () => window.clearTimeout(timer)
  }, [hasSeats, lockedUntil])

  // Gom ghế theo hàng (backend đã sắp theo hàng rồi theo số ghế)
  const seatRows: { label: string; seats: SeatMapItem[] }[] = []
  for (const seat of seats) {
    const lastRow = seatRows[seatRows.length - 1]
    if (lastRow && lastRow.label === seat.rowLabel) lastRow.seats.push(seat)
    else seatRows.push({ label: seat.rowLabel, seats: [seat] })
  }

  // Chỉ hiện chú thích cho các loại ghế có trong phòng này
  const typeOrder = (seatTypes ?? []).map((type) => type.id)
  const roomTypes = [...new Map(seats.map((seat) => [seat.seatType.id, seat.seatType])).values()].sort(
    (a, b) => typeOrder.indexOf(a.id) - typeOrder.indexOf(b.id),
  )
  function getTypeColor(seatTypeId: number) {
    const index = typeOrder.indexOf(seatTypeId)
    return SEAT_TYPE_COLORS[Math.max(index, 0) % SEAT_TYPE_COLORS.length]
  }

  function getSeatClass(seat: SeatMapItem) {
    if (mySeatIds.includes(seat.id)) return MINE_CLASS
    if (seat.status === 'booked') return BOOKED_CLASS
    if (seat.status === 'locked') return HELD_BY_OTHERS_CLASS
    return getTypeColor(seat.seatType.id)
  }

  async function handleSeatClick(seat: SeatMapItem) {
    // Chưa đăng nhập: sang trang đăng nhập, đăng nhập xong quay lại đúng trang này
    if (!user) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    if (saving || salesClosed) return

    const isSelected = mySeatIds.includes(seat.id)
    if (!isSelected && seat.status !== 'available') return
    if (!isSelected && mySeatIds.length >= MAX_SEATS) {
      setNotice({ title: 'Đã đủ số ghế', message: `Mỗi lần đặt chỉ được chọn tối đa ${MAX_SEATS} ghế.` })
      return
    }

    const nextIds = isSelected ? mySeatIds.filter((id) => id !== seat.id) : [...mySeatIds, seat.id]
    // Đổi màu ngay cho mượt, sai thì trả lại theo dữ liệu thật ở dưới
    setOverride({ seatIds: nextIds, lockedUntil, at: getTimestamp() })
    setSaving(true)
    try {
      const hold = await lockSeats(showtimeId, nextIds)
      setOverride({ seatIds: hold.seats.map((item) => item.id), lockedUntil: hold.lockedUntil, at: getTimestamp() })
    } catch (err) {
      // Ghế vừa bị người khác giữ (database chỉ cho 1 người), hết giờ bán vé...
      setOverride(null)
      setNotice({ title: 'Không giữ được ghế', message: getErrorMessage(err) })
    } finally {
      setSaving(false)
      setTick((value) => value + 1)
    }
  }

  if (loadingShowtime && !showtime) {
    return <p className="mx-auto max-w-7xl px-4 py-16 text-lg text-navy/60">Đang tải...</p>
  }

  if (showtimeError || !showtime) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-2xl font-bold">{showtimeError ?? 'Không tìm thấy suất chiếu'}</p>
        <Link to="/showtimes" className="mt-4 inline-block text-lg text-title hover:underline">
          Xem lịch chiếu
        </Link>
      </div>
    )
  }

  const { movie, room } = showtime
  const minutes = String(Math.floor((secondsLeft ?? 0) / 60)).padStart(2, '0')
  const seconds = String((secondsLeft ?? 0) % 60).padStart(2, '0')

  return (
    <div>
      {/* Thông tin suất chiếu, cùng kiểu khối tiêu đề các trang khác */}
      <section className="bg-navy-pattern text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-8 md:gap-8 md:py-10">
          {movie.posterUrl && (
            <Link to={getMoviePath(movie.title)} state={{ movieId: movie.id }} className="shrink-0">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="aspect-[2/3] w-20 rounded object-cover shadow-lg md:w-28"
              />
            </Link>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky">Chọn ghế</p>
            <h1 className="mt-1 text-2xl font-bold uppercase md:text-4xl">
              {movie.title}
              {movie.ageRating && (
                <span className="ml-3 rounded bg-red-600 px-2 py-0.5 align-middle text-sm font-bold">{movie.ageRating}</span>
              )}
            </h1>
            <p className="mt-2 text-lg text-white/85">
              {formatShowDate(showtime.showDate)} · {showtime.startTime} - {showtime.endTime} · {room.name} ·{' '}
              {room.cinema.name}
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-4 py-1 text-sm font-semibold ${
                salesClosed ? 'bg-red-600 text-white' : 'bg-sky/20 text-sky'
              }`}
            >
              {salesClosed ? 'Hết giờ đặt vé' : `Chọn tối đa ${MAX_SEATS} ghế`}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {!user && !salesClosed && (
          <p className="mb-4 rounded-lg bg-sky/10 px-4 py-3 text-navy/80">
            Bạn có thể xem sơ đồ ghế. Để chọn ghế, vui lòng{' '}
            <Link to="/login" state={{ from: location.pathname }} className="font-semibold text-title hover:underline">
              đăng nhập
            </Link>
            .
          </p>
        )}
        {salesClosed && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">
            Suất chiếu đã ngừng bán vé trực tuyến (ngừng trước giờ chiếu {BOOKING_CLOSE_MINUTES} phút).
          </p>
        )}

        {/* Sơ đồ ghế */}
        <div className="overflow-x-auto rounded-lg bg-white p-6 shadow-sm">
          {!seatData && !seatError && <p className="text-lg text-navy/60">Đang tải sơ đồ ghế...</p>}
          {seatError && !seatData && <p className="text-lg text-red-600">{seatError}</p>}

          {seatRows.length > 0 && (
            <div className="mx-auto w-max">
              {/* Màn hình chiếu dạng cung */}
              <div className="mx-auto mb-10 w-4/5">
                <div className="h-3 rounded-[50%/100%_100%_0_0] bg-linear-to-b from-sky to-sky/10" />
                <p className="mt-2 text-center text-sm tracking-[0.4em] text-navy/50">MÀN HÌNH</p>
              </div>

              <div className="space-y-2">
                {seatRows.map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 whitespace-nowrap font-semibold text-navy/60">Hàng {row.label}</span>
                    {row.seats.map((seat) => {
                      const isMine = mySeatIds.includes(seat.id)
                      const unavailable = !isMine && seat.status !== 'available'
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          onClick={() => handleSeatClick(seat)}
                          disabled={unavailable || salesClosed}
                          aria-pressed={isMine}
                          title={`Ghế ${getSeatLabel(seat)} - ${seat.seatType.name} - ${formatMoney(seat.seatType.price)}`}
                          className={`h-9 w-11 shrink-0 rounded-t-lg text-xs font-semibold transition disabled:cursor-not-allowed ${getSeatClass(
                            seat,
                          )} ${salesClosed && !unavailable ? 'opacity-60' : ''}`}
                        >
                          {getSeatLabel(seat)}
                        </button>
                      )
                    })}
                    {/* Khoảng trống bằng cột "Hàng A" để dãy ghế nằm giữa, thẳng với màn hình */}
                    <span className="w-20 shrink-0" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chú thích */}
          {seatRows.length > 0 && (
            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 border-t border-gray-100 pt-6 text-sm">
              {roomTypes.map((type) => (
                <span key={type.id} className="flex items-center gap-2">
                  <span className={`h-5 w-6 rounded-t-md ${getTypeColor(type.id)}`} />
                  {type.name} ({formatMoney(type.price)})
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span className={`h-5 w-6 rounded-t-md ${MINE_CLASS}`} />
                Ghế bạn chọn
              </span>
              <span className="flex items-center gap-2">
                <span className={`h-5 w-6 rounded-t-md ${HELD_BY_OTHERS_CLASS}`} />
                Người khác đang giữ
              </span>
              <span className="flex items-center gap-2">
                <span className={`h-5 w-6 rounded-t-md ${BOOKED_CLASS}`} />
                Đã bán
              </span>
            </div>
          )}
        </div>

        {/* Thanh tóm tắt: ghế đã chọn, tổng tiền, thời gian giữ ghế, nút thanh toán */}
        <div className="sticky bottom-0 z-10 mt-6 rounded-lg border-t-4 border-sky bg-white p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-navy/60">Ghế đã chọn ({mySeats.length}/{MAX_SEATS})</p>
              <p className="text-lg font-bold">
                {mySeats.length > 0 ? mySeats.map(getSeatLabel).join(', ') : 'Chưa chọn ghế'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {holdActive && (
                <div className="text-center">
                  <p className="text-sm text-navy/60">Thời gian giữ ghế</p>
                  <p
                    className={`font-mono text-2xl font-bold tabular-nums ${
                      (secondsLeft ?? 0) <= 60 ? 'animate-pulse text-red-600' : 'text-navy'
                    }`}
                  >
                    {minutes}:{seconds}
                  </p>
                </div>
              )}
              <div className="text-right">
                <p className="text-sm text-navy/60">Tạm tính</p>
                <p className="text-2xl font-bold text-title">{formatMoney(totalAmount)}</p>
              </div>
              {/* Chưa làm: bấm Thanh toán sẽ sang bước xác nhận và thanh toán (POST /bookings) */}
              <button
                type="button"
                disabled={!holdActive || saving}
                className="rounded bg-title px-8 py-3 text-lg font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>

      {notice && <NoticeModal title={notice.title} message={notice.message} onClose={() => setNotice(null)} />}
    </div>
  )
}

export default BookingPage