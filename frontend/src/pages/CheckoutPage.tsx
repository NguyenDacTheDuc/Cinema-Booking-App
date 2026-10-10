import { useEffect, useState, type ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Link, useNavigate, useParams } from 'react-router'
import { getErrorMessage } from '../api/axiosClient'
import { createBooking, getSeatMap } from '../api/bookingApi'
import { getShowtimeById } from '../api/showtimeApi'
import BookingSteps from '../components/booking/BookingSteps'
import ShowtimeHero from '../components/booking/ShowtimeHero'
import NoticeModal from '../components/common/NoticeModal'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { formatMoney } from '../utils/format'

// Thời gian chờ giả lập lúc "cổng thanh toán" xử lý
const PROCESSING_MS = 1500

type PaymentMethod = 'wallet' | 'bank' | 'card'

// Thanh toán mô phỏng: chỉ để khách chọn, không kết nối cổng thanh toán thật
const paymentMethods: { value: PaymentMethod; label: string; description: string; app: string; icon: ReactNode }[] = [
  {
    value: 'wallet',
    label: 'Ví điện tử',
    description: 'Thanh toán nhanh bằng ví trên điện thoại',
    app: 'ví điện tử',
    icon: (
      <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
        <path d="M21 8h-5a4 4 0 0 0 0 8h5V8Z" />
        <circle cx="16" cy="12" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'bank',
    label: 'Thẻ ATM / Internet Banking',
    description: 'Thẻ nội địa của các ngân hàng Việt Nam',
    app: 'ngân hàng',
    icon: (
      <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="m3 9 9-5 9 5" strokeLinejoin="round" />
        <path d="M5 10v7M10 10v7M14 10v7M19 10v7M3 20h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'card',
    label: 'Thẻ quốc tế',
    description: 'Visa, Mastercard, JCB',
    app: 'ngân hàng hoặc ví có liên kết thẻ quốc tế',
    icon: (
      <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="M2.5 10h19M6 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
]

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// Khung trắng có tiêu đề, dùng cho các khối trong trang
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm md:p-6">
      <h2 className="border-b border-gray-100 pb-3 text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

interface PaymentQrModalProps {
  methodLabel: string
  methodApp: string
  qrValue: string
  amount: number
  countdown: string // "04:32"
  urgent: boolean // còn dưới 1 phút
  orderInfo: { label: string; value: string }[]
  onCancel: () => void
  onPaid: () => void
}

// Cửa sổ "cổng thanh toán" mô phỏng: mã QR, số tiền, thời gian còn lại, thông tin đơn.
// Bấm "Tôi đã thanh toán" coi như khách đã quét mã và chuyển tiền xong
function PaymentQrModal({
  methodLabel,
  methodApp,
  qrValue,
  amount,
  countdown,
  urgent,
  orderInfo,
  onCancel,
  onPaid,
}: PaymentQrModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-qr-title"
          className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl"
        >
          {/* Đầu cửa sổ */}
          <div className="bg-navy-pattern flex items-start justify-between gap-4 px-6 py-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky">Cổng thanh toán Cinema Booking</p>
              <h2 id="payment-qr-title" className="mt-1 text-xl font-bold">
                Thanh toán qua {methodLabel}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="px-1 text-3xl leading-none text-white/70 transition hover:text-white"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          <div className="grid md:grid-cols-2">
            {/* Mã QR */}
            <div className="flex flex-col items-center bg-cream px-6 py-8 text-center">
              <p className="font-semibold">Quét mã QR để thanh toán</p>
              {/* Khung 4 góc quanh mã QR */}
              <div className="relative mt-4 p-3">
                <span className="absolute top-0 left-0 size-7 rounded-tl-lg border-t-4 border-l-4 border-sky" />
                <span className="absolute top-0 right-0 size-7 rounded-tr-lg border-t-4 border-r-4 border-sky" />
                <span className="absolute bottom-0 left-0 size-7 rounded-bl-lg border-b-4 border-l-4 border-sky" />
                <span className="absolute right-0 bottom-0 size-7 rounded-br-lg border-r-4 border-b-4 border-sky" />
                <div className="rounded bg-white p-3 shadow-sm">
                  <QRCodeSVG value={qrValue} size={184} level="M" title="Mã QR thanh toán mô phỏng" />
                </div>
              </div>
              <p className="mt-4 text-sm text-navy/60">Số tiền thanh toán</p>
              <p className="text-3xl font-bold text-title">{formatMoney(amount)}</p>
              <p
                className={`mt-4 rounded-full px-4 py-1.5 text-sm font-semibold ${
                  urgent ? 'animate-pulse bg-red-100 text-red-600' : 'bg-white text-navy shadow-sm'
                }`}
              >
                Giao dịch hết hạn sau <span className="font-mono text-base tabular-nums">{countdown}</span>
              </p>
            </div>

            {/* Thông tin đơn hàng và hướng dẫn */}
            <div className="px-6 py-6">
              <p className="border-b border-gray-100 pb-2 text-lg font-bold">Thông tin đơn hàng</p>
              <dl className="mt-3 space-y-2">
                {orderInfo.map((item) => (
                  <div key={item.label} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-navy/60">{item.label}</dt>
                    <dd className="text-right font-semibold">{item.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t-2 border-navy pt-2">
                  <dt className="font-semibold">Tổng cộng</dt>
                  <dd className="text-lg font-bold text-title">{formatMoney(amount)}</dd>
                </div>
              </dl>

              <p className="mt-5 border-b border-gray-100 pb-2 text-lg font-bold">Hướng dẫn thanh toán</p>
              <ol className="mt-3 space-y-2 text-sm text-navy/80">
                {[
                  `Mở ứng dụng ${methodApp} trên điện thoại.`,
                  'Chọn tính năng quét mã QR và quét mã bên cạnh.',
                  'Kiểm tra số tiền, xác nhận thanh toán trên ứng dụng.',
                  'Bấm "Tôi đã thanh toán" để hoàn tất đặt vé.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky/15 text-xs font-bold text-title">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Cuối cửa sổ */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-navy/60">Thanh toán mô phỏng, không trừ tiền thật.</p>
            <div className="flex w-full gap-3 sm:w-auto">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 whitespace-nowrap rounded border border-gray-300 px-4 py-2.5 font-semibold text-navy/80 transition hover:bg-gray-100 sm:flex-none sm:px-6"
              >
                Hủy giao dịch
              </button>
              <button
                type="button"
                onClick={onPaid}
                className="flex-1 whitespace-nowrap rounded bg-title px-4 py-2.5 font-semibold text-white transition hover:bg-navy sm:flex-none sm:px-6"
              >
                Tôi đã thanh toán
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Trang thanh toán (mô phỏng) các ghế đang giữ của 1 suất chiếu: /checkout/:showtimeId
function CheckoutPage() {
  const showtimeId = Number(useParams().showtimeId)
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: showtime, loading: loadingShowtime, error: showtimeError } = useFetch(
    () => getShowtimeById(showtimeId),
    [showtimeId],
  )
  // Ghế đang giữ nằm ở backend nên F5 hay mở lại trang vẫn lấy lại được
  const [reloadKey, setReloadKey] = useState(0)
  const { data: seats, error: seatError } = useFetch(() => getSeatMap(showtimeId), [showtimeId, reloadKey])

  const [method, setMethod] = useState<PaymentMethod>('wallet')
  const [agreed, setAgreed] = useState(false)
  const [paying, setPaying] = useState(false)
  // Cửa sổ mã QR thanh toán (mở khi bấm Xác nhận thanh toán)
  const [showQr, setShowQr] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string; backToSeats: boolean } | null>(null)

  // Đồng hồ 1 giây/lần cho đếm ngược thời gian giữ ghế
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const mySeats = (seats ?? []).filter((seat) => seat.isMine)
  const lockedUntil = mySeats[0]?.lockedUntil ?? null
  const secondsLeft = lockedUntil ? Math.max(0, Math.floor((new Date(lockedUntil).getTime() - now) / 1000)) : 0
  const holdActive = mySeats.length > 0 && secondsLeft > 0
  const totalAmount = mySeats.reduce((sum, seat) => sum + Number(seat.seatType.price), 0)
  const selectedMethod = paymentMethods.find((item) => item.value === method) ?? paymentMethods[0]

  // Gom ghế theo loại ghế để hiện từng dòng trong phần tóm tắt: "Ghế VIP x 2"
  const seatGroups = [...new Map(mySeats.map((seat) => [seat.seatType.id, seat.seatType])).values()].map((type) => {
    const count = mySeats.filter((seat) => seat.seatType.id === type.id).length
    return { ...type, count, subtotal: count * Number(type.price) }
  })

  // Hết thời gian giữ ghế khi đang ở trang thanh toán: báo và đưa về trang chọn ghế
  const hasSeats = mySeats.length > 0
  useEffect(() => {
    if (!hasSeats || !lockedUntil || paying) return
    const timer = window.setTimeout(
      () => {
        setShowQr(false)
        setNotice({
          title: 'Hết thời gian giữ ghế',
          message: 'Các ghế bạn chọn đã được nhả ra, vui lòng chọn lại ghế.',
          backToSeats: true,
        })
      },
      Math.max(new Date(lockedUntil).getTime() - Date.now(), 0),
    )
    return () => window.clearTimeout(timer)
  }, [hasSeats, lockedUntil, paying])

  // Bấm "Tôi đã thanh toán" trong cửa sổ QR: đóng cửa sổ, hiện "Đang xử lý" rồi tạo đơn
  async function handlePay() {
    if (!holdActive || !agreed || paying) return
    setShowQr(false)
    setPaying(true)
    try {
      // Chạy song song: gọi API tạo đơn và chờ giả lập cổng thanh toán
      const [booking] = await Promise.all([createBooking(showtimeId), wait(PROCESSING_MS)])
      // replace: bấm Back từ trang vé không quay lại trang thanh toán nữa
      navigate(`/tickets/${booking.id}`, { replace: true, state: { justBooked: true } })
    } catch (err) {
      setPaying(false)
      setNotice({ title: 'Thanh toán không thành công', message: getErrorMessage(err), backToSeats: false })
      setReloadKey((value) => value + 1)
    }
  }

  function handleCloseNotice() {
    const backToSeats = notice?.backToSeats
    setNotice(null)
    if (backToSeats) navigate(`/booking/${showtimeId}`, { replace: true })
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

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div>
      <ShowtimeHero eyebrow="Thanh toán" showtime={showtime}>
      </ShowtimeHero>
      <BookingSteps current={2} />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {!seats && !seatError && <p className="text-lg text-navy/60">Đang tải thông tin vé...</p>}
        {seatError && !seats && <p className="text-lg text-red-600">{seatError}</p>}

        {/* Không còn ghế nào đang giữ: chưa chọn ghế, đã hết giờ giữ, hoặc đã thanh toán ở tab khác */}
        {seats && mySeats.length === 0 && !paying && (
          <div className="mx-auto max-w-xl rounded-lg bg-white p-10 text-center shadow-sm">
            <p className="text-xl font-bold">Bạn chưa giữ ghế nào</p>
            <p className="mt-2 text-navy/70">
              Có thể bạn chưa chọn ghế hoặc thời gian giữ ghế đã hết. Vui lòng chọn ghế trước khi thanh toán.
            </p>
            <Link
              to={`/booking/${showtimeId}`}
              replace
              className="mt-6 inline-block rounded bg-title px-8 py-3 text-lg font-semibold text-white transition hover:bg-navy"
            >
              Chọn ghế
            </Link>
          </div>
        )}

        {mySeats.length > 0 && (
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Ghế đã chọn */}
              <Card title={`Ghế đã chọn (${mySeats.length} vé)`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-navy text-white">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Ghế</th>
                        <th className="px-4 py-2 font-semibold">Loại ghế</th>
                        <th className="px-4 py-2 text-right font-semibold">Giá vé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySeats.map((seat) => (
                        <tr key={seat.id} className="border-t border-gray-200">
                          <td className="px-4 py-2 font-semibold">
                            {seat.rowLabel}
                            {seat.columnNumber}
                          </td>
                          <td className="px-4 py-2">{seat.seatType.name}</td>
                          <td className="px-4 py-2 text-right">{formatMoney(seat.seatType.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Thông tin người đặt, lấy từ tài khoản đang đăng nhập */}
              {user && (
                <Card title="Thông tin khách hàng">
                  <dl className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-sm text-navy/60">Họ và tên</dt>
                      <dd className="font-semibold">{user.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-navy/60">Email</dt>
                      <dd className="break-all font-semibold">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-navy/60">Số điện thoại</dt>
                      <dd className="font-semibold">{user.phone}</dd>
                    </div>
                  </dl>
                </Card>
              )}

              {/* Phương thức thanh toán (mô phỏng) */}
              <Card title="Phương thức thanh toán">
                <div className="grid gap-3 sm:grid-cols-3">
                  {paymentMethods.map((item) => {
                    const selected = item.value === method
                    return (
                      <label
                        key={item.value}
                        className={`flex cursor-pointer flex-col gap-2 rounded-lg border-2 p-4 transition ${
                          selected ? 'border-sky bg-sky/5' : 'border-gray-200 hover:border-sky/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={item.value}
                          checked={selected}
                          onChange={() => setMethod(item.value)}
                          className="sr-only"
                        />
                        <span className="flex items-center justify-between">
                          <span className={selected ? 'text-title' : 'text-navy/60'}>{item.icon}</span>
                          <span
                            className={`size-5 rounded-full border-2 ${
                              selected ? 'border-title bg-title shadow-[inset_0_0_0_3px_white]' : 'border-gray-300'
                            }`}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-sm text-navy/60">{item.description}</span>
                      </label>
                    )
                  })}
                </div>

                {/* Thanh toan mo phong */}
              </Card>
            </div>

            {/* Tóm tắt đơn hàng: luôn nằm trong tầm mắt khi cuộn trang ở màn hình lớn */}
            <aside className="rounded-lg border-t-4 border-sky bg-white p-5 shadow-sm md:p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-bold">Tóm tắt đơn hàng</h2>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-cream px-4 py-3">
                <span className="text-navy/70">Thời gian giữ ghế</span>
                <span
                  className={`font-mono text-2xl font-bold tabular-nums ${
                    secondsLeft <= 60 ? 'animate-pulse text-red-600' : 'text-navy'
                  }`}
                >
                  {minutes}:{seconds}
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {seatGroups.map((group) => (
                  <li key={group.id} className="flex justify-between gap-4">
                    <span className="text-navy/80">
                      Ghế {group.name} x {group.count}
                    </span>
                    <span className="font-semibold">{formatMoney(group.subtotal)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-end justify-between border-t-2 border-navy pt-4">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-2xl font-bold text-title">{formatMoney(totalAmount)}</span>
              </div>

              <label className="mt-5 flex cursor-pointer gap-3 text-sm text-navy/80">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-title"
                />
                Tôi đã kiểm tra thông tin vé và đồng ý rằng vé đã thanh toán không thể đổi hoặc hoàn tiền.
              </label>

              <button
                type="button"
                onClick={() => setShowQr(true)}
                disabled={!holdActive || !agreed || paying}
                className="mt-5 w-full rounded bg-title px-8 py-3 text-lg font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Xác nhận thanh toán
              </button>
              <Link
                to={`/booking/${showtimeId}`}
                className="mt-3 block text-center text-title hover:underline"
              >
                Quay lại chọn ghế
              </Link>
            </aside>
          </div>
        )}
      </div>

      {showQr && holdActive && (
        <PaymentQrModal
          methodLabel={selectedMethod.label}
          methodApp={selectedMethod.app}
          qrValue={`CINEMA-BOOKING-DEMO|showtime=${showtimeId}|amount=${totalAmount}`}
          amount={totalAmount}
          countdown={`${minutes}:${seconds}`}
          urgent={secondsLeft <= 60}
          orderInfo={[
            { label: 'Phim', value: showtime.movie.title },
            {
              label: 'Suất chiếu',
              value: `${showtime.startTime} ${showtime.showDate.split('-').reverse().join('/')}`,
            },
            { label: 'Rạp', value: `${showtime.room.cinema.name} - ${showtime.room.name}` },
            { label: 'Ghế', value: mySeats.map((seat) => `${seat.rowLabel}${seat.columnNumber}`).join(', ') },
          ]}
          onCancel={() => setShowQr(false)}
          onPaid={handlePay}
        />
      )}

      {/* Màn hình chờ trong lúc "cổng thanh toán" xử lý */}
      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="status">
          <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-xl">
            <span className="mx-auto block size-12 animate-spin rounded-full border-4 border-sky/30 border-t-title" />
            <p className="mt-5 text-xl font-bold">Đang xử lý thanh toán...</p>
            <p className="mt-2 text-navy/70">Vui lòng không tắt hoặc tải lại trang.</p>
          </div>
        </div>
      )}

      {notice && (
        <NoticeModal
          title={notice.title}
          message={notice.message}
          buttonLabel={notice.backToSeats ? 'Chọn lại ghế' : 'Đã hiểu'}
          onClose={handleCloseNotice}
        />
      )}
    </div>
  )
}

export default CheckoutPage