import { useState } from 'react'
import { getAllBookings } from '../../api/bookingApi'
import Modal from '../../components/admin/Modal'
import { useFetch } from '../../hooks/useFetch'
import type { AdminBooking, BookingStatus } from '../../types/booking'
import { formatDate } from '../../utils/format'

// ======================= Hàm hỗ trợ =======================

// "190000.00" -> "190.000 ₫"
function formatMoney(value: number | string | null) {
  return `${Number(value ?? 0).toLocaleString('vi-VN')} ₫`
}

// "2026-10-10T05:30:00.000Z" -> "10-10-2026 12:30" (giờ Việt Nam)
function formatDateTime(value: string) {
  const date = new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000)
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mi = String(date.getUTCMinutes()).padStart(2, '0')
  return `${formatDate(date.toISOString())} ${hh}:${mi}`
}

// Danh sách ghế: "A5, A6, A7"
function getSeatLabels(booking: AdminBooking) {
  return booking.tickets.map((ticket) => `${ticket.seat.rowLabel}${ticket.seat.columnNumber}`).join(', ')
}

const statusStyles: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: 'Đã xác nhận', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-700' },
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const style = statusStyles[status]
  return (
    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${style.className}`}>{style.label}</span>
  )
}

// ======================= Chi tiết đơn =======================

function BookingDetailModal({ booking, onClose }: { booking: AdminBooking; onClose: () => void }) {
  const { showtime } = booking

  return (
    <Modal title={`Đơn đặt vé ${booking.bookingCode}`} onClose={onClose} size="lg">
      <div className="flex flex-col gap-6 sm:flex-row">
        {showtime.movie.posterUrl ? (
          <img
            src={showtime.movie.posterUrl}
            alt={showtime.movie.title}
            className="h-48 w-32 shrink-0 rounded object-cover shadow"
          />
        ) : (
          <div className="flex h-48 w-32 shrink-0 items-center justify-center rounded bg-gray-200 text-sm text-navy/50">
            Chưa có poster
          </div>
        )}

        <div className="grid flex-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xl font-bold">{showtime.movie.title}</p>
            <p className="text-navy/60">
              {showtime.movie.duration} phút{showtime.movie.ageRating && ` · ${showtime.movie.ageRating}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-navy/60">Suất chiếu</p>
            <p className="font-semibold">
              {showtime.startTime} - {showtime.endTime}, {formatDate(showtime.showDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-navy/60">Rạp - Phòng</p>
            <p className="font-semibold">
              {showtime.room.cinema.name} - {showtime.room.name}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-navy/60">Địa chỉ rạp</p>
            <p>{showtime.room.cinema.address}</p>
          </div>
          <div>
            <p className="text-sm text-navy/60">Khách hàng</p>
            <p className="break-all font-semibold">{booking.user.email}</p>
          </div>
          <div>
            <p className="text-sm text-navy/60">Đặt lúc</p>
            <p className="font-semibold">{formatDateTime(booking.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-navy/60">Trạng thái</p>
            <div className="mt-1">
              <StatusBadge status={booking.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách vé: mỗi vé là 1 ghế, giá chốt lúc đặt */}
      <table className="mt-6 w-full text-left">
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
              Tổng cộng ({booking.tickets.length} vé)
            </td>
            <td className="px-4 py-3 text-right text-xl font-bold text-title">{formatMoney(booking.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </Modal>
  )
}

// ======================= Trang quản lý đơn đặt vé =======================

const filterClass =
  'rounded border border-gray-300 bg-white px-3 py-2 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

function BookingManagementPage() {
  const { data: bookings, loading, error } = useFetch(() => getAllBookings(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BookingStatus | ''>('')
  const [detail, setDetail] = useState<AdminBooking | null>(null)

  // Lọc ngay trên trình duyệt: tìm theo mã đặt vé, email khách hoặc tên phim
  const keyword = search.trim().toLowerCase()
  const rows = (bookings ?? []).filter((booking) => {
    if (status && booking.status !== status) return false
    if (!keyword) return true
    return (
      booking.bookingCode.toLowerCase().includes(keyword) ||
      booking.user.email.toLowerCase().includes(keyword) ||
      booking.showtime.movie.title.toLowerCase().includes(keyword)
    )
  })

  // Tổng tiền các đơn đang hiển thị (chỉ tính đơn đã xác nhận)
  const totalRevenue = rows
    .filter((booking) => booking.status === 'confirmed')
    .reduce((sum, booking) => sum + Number(booking.totalAmount), 0)

  return (
    <div>
      <h1 className="text-3xl font-bold">Quản lý đơn đặt vé</h1>
      <p className="mt-2 text-lg text-navy/70">Đơn được tạo khi khách hàng đặt vé, admin chỉ xem.</p>

      {/* Bộ lọc */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã đặt vé, email, tên phim..."
          className={`${filterClass} w-full sm:w-80`}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus | '')}
          className={filterClass}
          aria-label="Trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="pending">Chờ thanh toán</option>
        </select>
        {bookings && (
          <p className="text-navy/70 sm:ml-auto">
            {rows.length} đơn · Doanh thu <span className="font-semibold text-navy">{formatMoney(totalRevenue)}</span>
          </p>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded bg-white shadow-sm">
        {loading && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {bookings && rows.length === 0 && (
          <p className="p-6 text-lg text-navy/60">
            {bookings.length === 0 ? 'Chưa có đơn đặt vé nào.' : 'Không có đơn nào phù hợp.'}
          </p>
        )}

        {rows.length > 0 && (
          <table className="w-full min-w-[1000px] text-left">
            <thead className="whitespace-nowrap bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Mã đặt vé</th>
                <th className="px-4 py-3 font-semibold">Khách hàng</th>
                <th className="px-4 py-3 font-semibold">Phim / Ghế</th>
                <th className="px-4 py-3 font-semibold">Suất chiếu</th>
                <th className="px-4 py-3 text-right font-semibold">Tổng tiền</th>
                <th className="px-4 py-3 font-semibold">Đặt lúc</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-t border-gray-200 hover:bg-cream">
                  <td className="px-4 py-3 font-mono font-semibold">{booking.bookingCode}</td>
                  <td className="px-4 py-3">{booking.user.email}</td>
                  <td className="min-w-40 px-4 py-3">
                    <p>{booking.showtime.movie.title}</p>
                    <p className="text-sm text-navy/60">
                      {booking.tickets.length} vé: {getSeatLabels(booking)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap font-semibold">
                      {booking.showtime.startTime}, {formatDate(booking.showtime.showDate)}
                    </p>
                    <p className="text-sm text-navy/60">
                      {booking.showtime.room.cinema.name} - {booking.showtime.room.name}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatMoney(booking.totalAmount)}</td>
                  <td className="px-4 py-3">{formatDateTime(booking.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setDetail(booking)}
                      className="whitespace-nowrap rounded border border-title px-4 py-1.5 text-title transition hover:bg-title hover:text-white"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && <BookingDetailModal booking={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

export default BookingManagementPage