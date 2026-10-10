import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { getSeatTypes } from '../api/seatTypeApi'
import { FilmIcon } from '../components/icons/Icons'
import { useFetch } from '../hooks/useFetch'
import { formatMoney } from '../utils/format'

// Loại ghế mặc định (ghế thường), không xóa được trong trang quản trị
const DEFAULT_SEAT_TYPE_ID = 1

// Màu theo loại ghế, cùng thứ tự với sơ đồ ghế ở trang chọn ghế và trang quản trị
const SEAT_TYPE_COLORS = [
  'bg-gray-200',
  'bg-amber-400',
  'bg-rose-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-sky-600',
]

// Vé tiêu chuẩn áp dụng cho mọi trường hợp
const appliesTo = [
  'Tất cả các phim, kể cả phim bom tấn',
  'Tất cả suất chiếu và khung giờ trong ngày',
  'Người lớn và trẻ em',
  'Đặt vé trực tuyến hoặc mua tại quầy',
]

// Lưu ý khi đặt vé, khớp với quy định của hệ thống
const notes = [
  'Giá vé tính theo loại ghế bạn chọn trên sơ đồ phòng chiếu.',
  'Mỗi lần đặt được chọn tối đa 8 ghế.',
  'Ghế bạn chọn được giữ trong 5 phút để hoàn tất đặt vé.',
  'Suất chiếu ngừng bán vé trực tuyến trước giờ chiếu 15 phút.',
  'Vui lòng chọn phim phù hợp độ tuổi theo nhãn phân loại (P, K, T13, T16, T18).',
]

function CheckIcon() {
  return (
    <svg className="mt-0.5 size-5 shrink-0 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Tiêu đề khối, cùng kiểu với trang chủ và trang Giới thiệu
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="border-b-2 border-sky">
      <h2 className="-mb-0.5 inline-flex items-center gap-2 border-b-[3px] border-navy pb-3 text-3xl font-bold uppercase md:text-4xl">
        <FilmIcon className="size-10" />
        {children}
      </h2>
    </div>
  )
}

function TicketPricesPage() {
  // Giá lấy thật từ bảng loại ghế (admin sửa giá là trang này đổi theo)
  const { data: seatTypes, loading, error } = useFetch(() => getSeatTypes(), [])
  const defaultType = seatTypes?.find((type) => type.id === DEFAULT_SEAT_TYPE_ID) ?? seatTypes?.[0]

  return (
    <div>
      {/* Khối tiêu đề, cùng kiểu với trang Giới thiệu và Lịch chiếu */}
      <section className="bg-navy-pattern">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center text-white md:py-20">
          <p className="text-lg font-semibold uppercase tracking-[0.3em] text-sky">Cinema Booking</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Giá vé</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Một mức giá cho mọi suất chiếu, minh bạch và dễ hiểu.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {loading && !seatTypes && <p className="py-12 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="py-12 text-lg text-red-600">{error}</p>}

        {seatTypes && (
          <>
            {/* Vé tiêu chuẩn */}
            <section className="py-12">
              <SectionTitle>Vé tiêu chuẩn</SectionTitle>
              <div className="mt-8 overflow-hidden rounded-lg bg-white shadow-sm md:flex">
                <div className="bg-navy-pattern flex flex-col items-center justify-center px-8 py-10 text-center text-white md:w-2/5">
                  <p className="text-lg uppercase tracking-[0.2em] text-white/70">Đồng giá</p>
                  <p className="mt-2 text-5xl font-bold text-sky md:text-6xl">
                    {defaultType ? formatMoney(defaultType.price) : '...'}
                  </p>
                  <p className="mt-2 text-lg text-white/80">/ vé {defaultType ? defaultType.name.toLowerCase() : ''}</p>
                </div>
                <div className="flex-1 px-8 py-10">
                  <p className="text-xl font-bold">Áp dụng cho</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {appliesTo.map((item) => (
                      <li key={item} className="flex gap-3 text-lg text-navy/80">
                        <CheckIcon />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Giá theo loại ghế */}
            {seatTypes.length > 0 && (
              <section className="pb-12">
                <SectionTitle>Giá theo loại ghế</SectionTitle>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {seatTypes.map((type, index) => (
                    <div key={type.id} className="flex items-center gap-5 rounded-lg border-t-4 border-sky bg-white p-6 shadow-sm">
                      {/* Hình ghế, cùng màu với sơ đồ ghế */}
                      <span
                        className={`h-12 w-14 shrink-0 rounded-t-2xl ${SEAT_TYPE_COLORS[index % SEAT_TYPE_COLORS.length]}`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xl font-bold">
                          Ghế {type.name}
                          {type.id === DEFAULT_SEAT_TYPE_ID && (
                            <span className="ml-2 rounded-full bg-sky/15 px-2 py-0.5 align-middle text-xs font-semibold text-title">
                              Tiêu chuẩn
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-title">{formatMoney(type.price)}</p>
                        <p className="text-sm text-navy/60">mỗi vé</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Lưu ý */}
        <section className="pb-12">
          <SectionTitle>Lưu ý khi đặt vé</SectionTitle>
          <ul className="mt-8 space-y-3 rounded-lg bg-white p-6 shadow-sm md:p-8">
            {notes.map((note) => (
              <li key={note} className="flex gap-3 text-lg text-navy/80">
                <CheckIcon />
                {note}
              </li>
            ))}
          </ul>
        </section>

        {/* Kêu gọi đặt vé */}
        <section className="mb-12 rounded-lg bg-white px-6 py-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold md:text-3xl">Chọn suất chiếu phù hợp với bạn</h2>
          <p className="mt-2 text-lg text-navy/70">Xem lịch chiếu và đặt vé chỉ trong vài bước.</p>
          <Link
            to="/showtimes"
            className="mt-6 inline-block rounded bg-title px-8 py-3 text-lg font-semibold text-white transition hover:bg-navy"
          >
            Xem lịch chiếu
          </Link>
        </section>
      </div>
    </div>
  )
}

export default TicketPricesPage