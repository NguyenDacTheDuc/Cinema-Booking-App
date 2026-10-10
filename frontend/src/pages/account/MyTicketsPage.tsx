import { useState } from 'react'
import { Link } from 'react-router'
import { getMyBookings } from '../../api/bookingApi'
import { useFetch } from '../../hooks/useFetch'
import type { Booking, BookingStatus } from '../../types/booking'
import { formatDate, formatMoney } from '../../utils/format'

type Tab = 'upcoming' | 'watched'

const tabs: { value: Tab; label: string }[] = [
  { value: 'upcoming', label: 'Sắp chiếu' },
  { value: 'watched', label: 'Đã xem' },
]

const statusStyles: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: 'Đã xác nhận', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
}

// Thời điểm suất chiếu kết thúc (giờ Việt Nam), dùng để chia "Sắp chiếu" / "Đã xem"
function getEndTime(booking: Booking) {
  const { showDate, endTime } = booking.showtime
  return new Date(`${showDate}T${endTime}:00+07:00`).getTime()
}

function getStartTime(booking: Booking) {
  const { showDate, startTime } = booking.showtime
  return new Date(`${showDate}T${startTime}:00+07:00`).getTime()
}

function TicketCard({ booking, watched }: { booking: Booking; watched: boolean }) {
  const { showtime } = booking
  const status = statusStyles[booking.status]
  const seats = booking.tickets.map((ticket) => `${ticket.seat.rowLabel}${ticket.seat.columnNumber}`).join(', ')

  return (
    <article className={`flex gap-4 rounded-lg bg-white p-4 shadow-sm sm:gap-6 sm:p-5 ${watched ? 'opacity-75' : ''}`}>
      {showtime.movie.posterUrl ? (
        <img
          src={showtime.movie.posterUrl}
          alt={showtime.movie.title}
          className="h-36 w-24 shrink-0 rounded object-cover shadow sm:h-44 sm:w-30"
        />
      ) : (
        <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded bg-gray-200 text-center text-xs text-navy/50 sm:h-44 sm:w-30">
          Chưa có poster
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-title">
              {showtime.movie.title}
              {showtime.movie.ageRating && (
                <span className="ml-2 rounded bg-amber-400 px-1.5 py-0.5 align-middle text-xs font-bold text-white">
                  {showtime.movie.ageRating}
                </span>
              )}
            </h2>
            <p className="text-sm text-navy/60">
              Mã đặt vé <span className="font-mono font-semibold text-navy">{booking.bookingCode}</span>
            </p>
          </div>
          <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>

        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-navy/60">Suất chiếu</dt>
            <dd className="font-semibold">
              {showtime.startTime} - {showtime.endTime}, {formatDate(showtime.showDate)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-navy/60">Rạp</dt>
            <dd className="font-semibold">
              {showtime.room.cinema.name} - {showtime.room.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-navy/60">Ghế ({booking.tickets.length} vé)</dt>
            <dd className="font-semibold">{seats}</dd>
          </div>
          <div>
            <dt className="text-sm text-navy/60">Tổng tiền</dt>
            <dd className="font-semibold">{formatMoney(booking.totalAmount)}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <p className="text-sm text-navy/60">{showtime.room.cinema.address}</p>
          <Link
            to={`/tickets/${booking.id}`}
            className="whitespace-nowrap rounded border border-title px-4 py-1.5 font-semibold text-title transition hover:bg-title hover:text-white"
          >
            Xem vé điện tử
          </Link>
        </div>
      </div>
    </article>
  )
}

function MyTicketsPage() {
  const { data: bookings, loading, error } = useFetch(() => getMyBookings(), [])
  const [tab, setTab] = useState<Tab>('upcoming')
  // Mốc thời gian lúc mở trang, dùng để chia nhóm
  const [now] = useState(() => Date.now())

  // Chia 2 nhóm: suất chưa kết thúc (gần nhất lên đầu) và suất đã chiếu xong (mới nhất lên đầu)
  const upcoming = (bookings ?? [])
    .filter((booking) => getEndTime(booking) > now)
    .sort((a, b) => getStartTime(a) - getStartTime(b))
  const watched = (bookings ?? [])
    .filter((booking) => getEndTime(booking) <= now)
    .sort((a, b) => getStartTime(b) - getStartTime(a))
  const groups: Record<Tab, Booking[]> = { upcoming, watched }
  const rows = groups[tab]

  return (
    <div>
      <h1 className="text-3xl font-bold">Vé của tôi</h1>

      <div className="mt-6 flex gap-2 border-b border-gray-300">
        {tabs.map((item) => {
          const isActive = item.value === tab
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`-mb-px border-b-4 px-5 py-2.5 text-lg transition ${
                isActive ? 'border-sky font-semibold text-title' : 'border-transparent text-navy/60 hover:text-navy'
              }`}
            >
              {item.label}
              {bookings && <span className="ml-2 text-sm">({groups[item.value].length})</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="text-lg text-red-600">{error}</p>}

        {bookings && rows.length === 0 && (
          <div className="rounded-lg bg-white p-10 text-center shadow-sm">
            <p className="text-lg text-navy/60">
              {tab === 'upcoming' ? 'Bạn chưa có vé nào sắp chiếu.' : 'Bạn chưa xem phim nào.'}
            </p>
            {tab === 'upcoming' && (
              <Link
                to="/"
                className="mt-4 inline-block rounded bg-title px-6 py-2.5 text-lg font-semibold text-white transition hover:bg-navy"
              >
                Đặt vé ngay
              </Link>
            )}
          </div>
        )}

        {rows.map((booking) => (
          <TicketCard key={booking.id} booking={booking} watched={tab === 'watched'} />
        ))}
      </div>
    </div>
  )
}

export default MyTicketsPage