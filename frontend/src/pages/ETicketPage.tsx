import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useLocation, useParams } from 'react-router'
import { getBookingById } from '../api/bookingApi'
import BookingSteps from '../components/booking/BookingSteps'
import { FilmIcon } from '../components/icons/Icons'
import { useFetch } from '../hooks/useFetch'
import type { Booking } from '../types/booking'
import { formatMoney } from '../utils/format'

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const notes = [
  'Vui lòng có mặt tại rạp trước giờ chiếu ít nhất 15 phút.',
  'Xuất trình mã QR hoặc mã đặt vé cho nhân viên tại quầy để vào phòng chiếu.',
  'Vé chỉ có giá trị cho suất chiếu, phòng chiếu và ghế ghi trên vé.',
  'Vé đã thanh toán không thể đổi hoặc hoàn tiền.',
]

// "2026-10-10" -> "Thứ Bảy, 10/10/2026"
function formatShowDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${weekday}, ${value.split('-').reverse().join('/')}`
}

// "2026-10-10T05:30:00.000Z" -> "12:30 10/10/2026" (giờ Việt Nam)
function formatDateTime(value: string) {
  const date = new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000)
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} ${pad(date.getUTCDate())}/${pad(
    date.getUTCMonth() + 1,
  )}/${date.getUTCFullYear()}`
}

function getStatus(booking: Booking, now: number) {
  const { showDate, endTime } = booking.showtime
  if (new Date(`${showDate}T${endTime}:00+07:00`).getTime() <= now) {
    return { label: 'Đã chiếu', className: 'bg-gray-200 text-navy/70' }
  }
  if (booking.status === 'pending') {
    return { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'Đã xác nhận', className: 'bg-green-100 text-green-700' }
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-navy/60">{label}</dt>
      <dd className="text-lg font-bold">{value}</dd>
    </div>
  )
}

// Mã đặt vé kèm mã QR (QR chỉ chứa mã đặt vé) và nút sao chép
function TicketCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => setCopied(false))
  }

  return (
    <div className="flex flex-col items-center px-6 py-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-navy/60 md:hidden">Mã đặt vé</p>
      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 md:mt-0">
        <QRCodeSVG value={code} size={168} level="M" title={`Mã QR vé ${code}`} />
      </div>
      <p className="mt-4 font-mono text-2xl font-bold tracking-[0.15em] text-navy">{code}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 rounded border border-title px-4 py-1.5 text-sm font-semibold text-title transition hover:bg-title hover:text-white"
      >
        {copied ? 'Đã sao chép' : 'Sao chép mã'}
      </button>
      <p className="mt-3 text-sm text-navy/60">Đưa mã này cho nhân viên tại quầy</p>
    </div>
  )
}

// Vé điện tử của 1 đơn đặt vé: /tickets/:bookingId
function ETicketPage() {
  const bookingId = Number(useParams().bookingId)
  const location = useLocation()
  // Vừa thanh toán xong (từ trang thanh toán chuyển sang) thì hiện lời chúc mừng và thanh tiến trình
  const justBooked = (location.state as { justBooked?: boolean } | null)?.justBooked === true

  const { data: booking, loading, error } = useFetch(() => getBookingById(bookingId), [bookingId])
  const [now] = useState(() => Date.now())

  if (loading && !booking) {
    return <p className="mx-auto max-w-7xl px-4 py-16 text-lg text-navy/60">Đang tải...</p>
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-2xl font-bold">{error ?? 'Không tìm thấy vé'}</p>
        <Link to="/account/tickets" className="mt-4 inline-block text-lg text-title hover:underline">
          Xem vé của tôi
        </Link>
      </div>
    )
  }

  const { showtime } = booking
  const { movie, room } = showtime
  const status = getStatus(booking, now)
  const seats = booking.tickets.map((ticket) => `${ticket.seat.rowLabel}${ticket.seat.columnNumber}`).join(', ')

  return (
    <div>
      {/* Khối tiêu đề, cùng kiểu với các trang khác */}
      <section className="bg-navy-pattern">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-white md:py-14">
          {justBooked ? (
            <>
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-500">
                <svg className="size-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h1 className="mt-4 text-3xl font-bold md:text-4xl">Đặt vé thành công</h1>
              <p className="mx-auto mt-3 max-w-2xl text-lg text-white/80">
                Cảm ơn bạn đã đặt vé. Vé điện tử của bạn đã sẵn sàng, bạn có thể xem lại bất cứ lúc nào trong mục Vé của tôi.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold uppercase tracking-[0.3em] text-sky">Cinema Booking</p>
              <h1 className="mt-3 text-4xl font-bold md:text-5xl">Vé điện tử</h1>
            </>
          )}
        </div>
      </section>
      {justBooked && <BookingSteps current={3} />}

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Tấm vé: phần thông tin bên trái, cuống vé có mã QR bên phải (điện thoại thì nằm dưới) */}
        <article className="overflow-hidden rounded-xl bg-white shadow-lg md:flex">
          <div className="min-w-0 flex-1">
            <div className="bg-navy-pattern flex h-14 items-center justify-between gap-3 px-6 text-white">
              <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <FilmIcon className="size-6 text-sky" />
                Cinema Booking
              </span>
              <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}>
                {status.label}
              </span>
            </div>

            <div className="flex gap-5 p-6">
              {movie.posterUrl && (
                <img src={movie.posterUrl} alt={movie.title} className="aspect-[2/3] w-20 shrink-0 rounded object-cover shadow md:w-24" />
              )}
              <div className="min-w-0">
                <h2 className="text-2xl font-bold uppercase leading-tight text-title">{movie.title}</h2>
                <p className="mt-1 text-navy/60">
                  {movie.duration} phút
                  {movie.ageRating && (
                    <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">{movie.ageRating}</span>
                  )}
                </p>
                <p className="mt-3 font-semibold">{room.cinema.name}</p>
                <p className="text-sm text-navy/60">{room.cinema.address}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-dashed border-gray-200 px-6 py-5 sm:grid-cols-3">
              <InfoItem label="Ngày chiếu" value={formatShowDate(showtime.showDate)} />
              <InfoItem label="Giờ chiếu" value={`${showtime.startTime} - ${showtime.endTime}`} />
              <InfoItem label="Phòng chiếu" value={room.name} />
              <InfoItem label={`Ghế (${booking.tickets.length} vé)`} value={seats} />
              <InfoItem label="Tổng tiền" value={formatMoney(booking.totalAmount)} />
              <InfoItem label="Đặt lúc" value={formatDateTime(booking.createdAt)} />
            </dl>
          </div>

          {/* Đường xé vé: khoét nửa hình tròn ở 2 đầu, cùng màu nền trang */}
          <div className="relative border-t-2 border-dashed border-gray-300 md:hidden" aria-hidden="true">
            <span className="absolute -top-3 -left-3 size-6 rounded-full bg-cream" />
            <span className="absolute -top-3 -right-3 size-6 rounded-full bg-cream" />
          </div>
          <div className="relative hidden border-l-2 border-dashed border-gray-300 md:block" aria-hidden="true">
            <span className="absolute -top-3 -left-3 size-6 rounded-full bg-cream" />
            <span className="absolute -bottom-3 -left-3 size-6 rounded-full bg-cream" />
          </div>

          <div className="md:w-72 md:shrink-0">
            <div className="bg-navy-pattern hidden h-14 items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-white md:flex">
              Mã đặt vé
            </div>
            <TicketCode code={booking.bookingCode} />
          </div>
        </article>

        {/* Chi tiết giá từng vé */}
        <section className="mt-6 rounded-lg bg-white p-5 shadow-sm md:p-6">
          <h2 className="border-b border-gray-100 pb-3 text-xl font-bold">Chi tiết thanh toán</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-4 py-2 font-semibold">Ghế</th>
                  <th className="px-4 py-2 font-semibold">Loại ghế</th>
                  <th className="px-4 py-2 text-right font-semibold">Giá vé</th>
                </tr>
              </thead>
              <tbody>
                {booking.tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-gray-200">
                    <td className="px-4 py-2 font-semibold">
                      {ticket.seat.rowLabel}
                      {ticket.seat.columnNumber}
                    </td>
                    <td className="px-4 py-2">{ticket.seat.seatType.name}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(ticket.priceAtBooking)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-navy">
                  <td colSpan={2} className="px-4 py-3 font-semibold">
                    Tổng cộng
                  </td>
                  <td className="px-4 py-3 text-right text-xl font-bold text-title">{formatMoney(booking.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Lưu ý */}
        <section className="mt-6 rounded-lg bg-white p-5 shadow-sm md:p-6">
          <h2 className="border-b border-gray-100 pb-3 text-xl font-bold">Lưu ý</h2>
          <ul className="mt-4 space-y-2">
            {notes.map((note) => (
              <li key={note} className="flex gap-3 text-navy/80">
                <svg className="mt-0.5 size-5 shrink-0 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {note}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/account/tickets"
            className="rounded bg-title px-8 py-3 text-lg font-semibold text-white transition hover:bg-navy"
          >
            Vé của tôi
          </Link>
          <Link
            to="/"
            className="rounded border border-title px-8 py-3 text-lg font-semibold text-title transition hover:bg-title hover:text-white"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ETicketPage