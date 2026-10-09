import { useState } from 'react'
import { Link } from 'react-router'
import { getDashboard } from '../../api/dashboardApi'
import { useFetch } from '../../hooks/useFetch'
import type { DailySales, LatestBooking, ShowtimeState, TodayShowtime, TopMovie } from '../../types/dashboard'

// ======================= Định dạng số, ngày =======================

// 32004000 -> "32.004.000 ₫"
function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`
}

// 32004000 -> "32 tr" (dùng cho nhãn trục biểu đồ)
function formatMillion(value: number) {
  return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`
}

// So với hôm qua: "+18,4%" / "-5,0%"; hôm qua bằng 0 thì không so được
function formatChange(today: number, yesterday: number) {
  if (yesterday === 0) return null
  const change = ((today - yesterday) / yesterday) * 100
  const sign = change > 0 ? '+' : ''
  return { text: `${sign}${change.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`, up: change >= 0 }
}

// "2026-10-09" -> "09/10"
function formatDayMonth(date: string) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

// Thời điểm ISO -> "21:10 09/10" theo giờ Việt Nam (UTC+7)
function formatDateTime(iso: string) {
  const vietnamTime = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')
  const time = `${pad(vietnamTime.getUTCHours())}:${pad(vietnamTime.getUTCMinutes())}`
  return `${time} ${pad(vietnamTime.getUTCDate())}/${pad(vietnamTime.getUTCMonth() + 1)}`
}

// Làm tròn lên số đẹp cho đỉnh trục biểu đồ: 32.004.000 -> 40.000.000
function getNiceMax(value: number) {
  if (value <= 0) return 1
  const step = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / step) * step
}

const todayText = new Date().toLocaleDateString('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
})

const cardClass = 'rounded bg-white p-5 shadow-sm'

// ======================= Thẻ số liệu =======================

interface StatCardProps {
  label: string
  value: string
  change?: { text: string; up: boolean } | null // undefined: thẻ không so sánh với hôm qua
  note?: string
}

function StatCard({ label, value, change, note }: StatCardProps) {
  return (
    <div className={cardClass}>
      <p className="text-navy/60">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {change !== undefined && (
        <p className="mt-1 text-sm text-navy/60">
          {change ? (
            <>
              <span className={`font-semibold ${change.up ? 'text-green-600' : 'text-red-600'}`}>{change.text}</span> so với
              hôm qua
            </>
          ) : (
            'Hôm qua chưa có số liệu để so sánh'
          )}
        </p>
      )}
      {note && <p className="mt-1 text-sm text-navy/60">{note}</p>}
    </div>
  )
}

// ======================= Biểu đồ doanh thu =======================

const RANGE_OPTIONS = [7, 30]

function RevenueChart({ days }: { days: DailySales[] }) {
  const [range, setRange] = useState(7)
  const shownDays = days.slice(-range)

  const totalRevenue = shownDays.reduce((sum, day) => sum + day.revenue, 0)
  const totalTickets = shownDays.reduce((sum, day) => sum + day.tickets, 0)
  const niceMax = getNiceMax(Math.max(...shownDays.map((day) => day.revenue)))
  const gridValues = [1, 0.75, 0.5, 0.25, 0].map((ratio) => niceMax * ratio)
  // 30 ngày thì cứ 5 ngày hiện 1 nhãn (tính lùi từ hôm nay) cho khỏi chồng chữ
  const labelStep = range > 7 ? 5 : 1

  return (
    <div className={`${cardClass} xl:col-span-2`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Doanh thu theo ngày</h2>
          <p className="text-sm text-navy/60">
            Tổng {range} ngày: {formatMoney(totalRevenue)} · {totalTickets.toLocaleString('vi-VN')} vé
          </p>
        </div>
        <div className="flex overflow-hidden rounded border border-gray-300">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`px-3 py-1 text-sm transition ${range === option ? 'bg-title text-white' : 'hover:bg-gray-100'}`}
            >
              {option} ngày
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {/* Nhãn trục dọc */}
        <div className="relative h-64 w-12 shrink-0 text-right text-xs text-navy/50">
          {gridValues.map((value) => (
            <span
              key={value}
              className="absolute right-0 -translate-y-1/2 whitespace-nowrap"
              style={{ top: `${(1 - value / niceMax) * 100}%` }}
            >
              {value === 0 ? '0' : formatMillion(value)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-64">
            {/* Đường kẻ ngang */}
            {gridValues.map((value) => (
              <div
                key={value}
                className="absolute inset-x-0 border-t border-gray-200"
                style={{ top: `${(1 - value / niceMax) * 100}%` }}
              />
            ))}

            {/* Các cột doanh thu, rê chuột vào để xem chi tiết */}
            <div className="relative flex h-full items-end gap-1">
              {shownDays.map((day, index) => (
                <div key={day.date} className="group relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="w-full max-w-8 rounded-t bg-title transition group-hover:bg-navy"
                    style={{ height: `${(day.revenue / niceMax) * 100}%` }}
                  />
                  {/* Khung chi tiết: cột sát mép thì canh theo mép để không tràn ra ngoài */}
                  <div
                    className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded bg-navy px-3 py-2 text-sm text-white shadow group-hover:block ${
                      index < 2 ? 'left-0' : index >= shownDays.length - 2 ? 'right-0' : ''
                    }`}
                  >
                    <p className="text-white/70">{formatDayMonth(day.date)}</p>
                    <p>Doanh thu: {formatMoney(day.revenue)}</p>
                    <p>Vé: {day.tickets.toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nhãn ngày dưới trục ngang */}
          <div className="mt-2 flex gap-1 text-xs text-navy/50">
            {shownDays.map((day, index) => (
              <span key={day.date} className="flex-1 text-center">
                {(shownDays.length - 1 - index) % labelStep === 0 ? formatDayMonth(day.date) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ======================= Top phim =======================

function TopMovies({ movies }: { movies: TopMovie[] }) {
  const maxTickets = Math.max(1, ...movies.map((movie) => movie.tickets))

  return (
    <div className={cardClass}>
      <h2 className="text-xl font-semibold">Top phim bán chạy</h2>
      <p className="text-sm text-navy/60">7 ngày qua, xếp theo số vé</p>

      {movies.length === 0 ? (
        <p className="mt-6 text-navy/60">Chưa có vé nào được bán trong 7 ngày qua.</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {movies.map((movie, index) => (
            <li key={movie.movieId}>
              <div className="flex justify-between gap-3">
                <span className="truncate">
                  {index + 1}. {movie.title}
                </span>
                <span className="shrink-0 text-sm text-navy/60">{movie.tickets.toLocaleString('vi-VN')} vé</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${index === 0 ? 'bg-title' : 'bg-sky/60'}`}
                  style={{ width: `${(movie.tickets / maxTickets) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-sm text-navy/60">{formatMoney(movie.revenue)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ======================= Suất chiếu hôm nay =======================

const stateStyles: Record<ShowtimeState, { label: string; className: string }> = {
  upcoming: { label: 'Sắp chiếu', className: 'bg-sky/15 text-title' },
  showing: { label: 'Đang chiếu', className: 'bg-green-100 text-green-700' },
  ended: { label: 'Đã chiếu', className: 'bg-gray-100 text-gray-500' },
}

const thClass = 'whitespace-nowrap px-4 py-3 font-semibold'
const tdClass = 'whitespace-nowrap px-4 py-3'

function TodayShowtimes({ showtimes }: { showtimes: TodayShowtime[] }) {
  return (
    <div className={cardClass}>
      <h2 className="text-xl font-semibold">Suất chiếu hôm nay</h2>
      <p className="text-sm text-navy/60">Số ghế đã bán trên tổng số ghế của phòng</p>

      {showtimes.length === 0 ? (
        <p className="mt-6 text-navy/60">Hôm nay chưa có suất chiếu nào.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 text-navy/60">
              <tr>
                <th className={thClass}>Giờ chiếu</th>
                <th className={thClass}>Phim</th>
                <th className={thClass}>Rạp</th>
                <th className={thClass}>Phòng</th>
                <th className={thClass}>Ghế đã bán</th>
                <th className={thClass}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {showtimes.map((showtime) => {
                const percent = showtime.totalSeats > 0 ? (showtime.soldSeats / showtime.totalSeats) * 100 : 0
                const state = stateStyles[showtime.state]
                return (
                  <tr key={showtime.id} className="border-b border-gray-100 last:border-0">
                    <td className={`${tdClass} font-semibold`}>
                      {showtime.startTime} - {showtime.endTime}
                    </td>
                    <td className={tdClass}>{showtime.movie.title}</td>
                    <td className={tdClass}>{showtime.room.cinema.name}</td>
                    <td className={tdClass}>{showtime.room.name}</td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full rounded-full bg-title" style={{ width: `${percent}%` }} />
                        </div>
                        <span>
                          {showtime.soldSeats}/{showtime.totalSeats}
                        </span>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <span className={`rounded-full px-3 py-1 text-sm ${state.className}`}>{state.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ======================= Đơn đặt vé mới nhất =======================

function LatestBookings({ bookings }: { bookings: LatestBooking[] }) {
  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Đơn đặt vé mới nhất</h2>
          <p className="text-sm text-navy/60">{bookings.length} đơn gần nhất</p>
        </div>
        <Link to="/admin/bookings" className="text-title hover:underline">
          Xem tất cả đơn →
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="mt-6 text-navy/60">Chưa có đơn đặt vé nào.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 text-navy/60">
              <tr>
                <th className={thClass}>Mã đơn</th>
                <th className={thClass}>Khách hàng</th>
                <th className={thClass}>Phim</th>
                <th className={thClass}>Suất chiếu</th>
                <th className={thClass}>Ghế</th>
                <th className={`${thClass} text-right`}>Tổng tiền</th>
                <th className={thClass}>Đặt lúc</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 last:border-0">
                  <td className={`${tdClass} font-semibold`}>#{booking.id}</td>
                  <td className={tdClass}>{booking.user.fullName}</td>
                  <td className={tdClass}>{booking.showtime.movie.title}</td>
                  <td className={tdClass}>
                    {booking.showtime.startTime} {formatDayMonth(booking.showtime.showDate)}
                  </td>
                  <td className={tdClass}>{booking.seats.join(', ')}</td>
                  <td className={`${tdClass} text-right`}>{formatMoney(booking.totalAmount)}</td>
                  <td className={tdClass}>{formatDateTime(booking.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ======================= Trang Tổng quan =======================

function DashboardPage() {
  const { data, loading, error } = useFetch(() => getDashboard(), [])

  if (loading) return <p className="text-lg text-navy/60">Đang tải...</p>
  if (error || !data) return <p className="text-lg text-red-600">{error ?? 'Không tải được dữ liệu'}</p>

  const { summary } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tổng quan</h1>
        <p className="mt-1 text-navy/60 first-letter:uppercase">{todayText}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doanh thu hôm nay"
          value={formatMoney(summary.revenueToday)}
          change={formatChange(summary.revenueToday, summary.revenueYesterday)}
          note={`Tháng này: ${formatMoney(summary.revenueThisMonth)}`}
        />
        <StatCard
          label="Vé bán hôm nay"
          value={summary.ticketsToday.toLocaleString('vi-VN')}
          change={formatChange(summary.ticketsToday, summary.ticketsYesterday)}
          note={`Hôm qua: ${summary.ticketsYesterday.toLocaleString('vi-VN')} vé`}
        />
        <StatCard
          label="Đơn đặt vé hôm nay"
          value={summary.bookingsToday.toLocaleString('vi-VN')}
          change={formatChange(summary.bookingsToday, summary.bookingsYesterday)}
          note={`Hôm qua: ${summary.bookingsYesterday.toLocaleString('vi-VN')} đơn`}
        />
        <StatCard
          label="Phim đang chiếu"
          value={summary.nowShowingMovies.toLocaleString('vi-VN')}
          note={`${summary.comingSoonMovies} phim sắp chiếu`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <RevenueChart days={data.revenueByDay} />
        <TopMovies movies={data.topMovies} />
      </div>

      <TodayShowtimes showtimes={data.todayShowtimes} />
      <LatestBookings bookings={data.latestBookings} />
    </div>
  )
}

export default DashboardPage