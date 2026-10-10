import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { getActiveCinemas } from '../api/cinemaApi'
import { getMovies } from '../api/movieApi'
import WhyChooseUs from '../components/common/WhyChooseUs'
import { FilmIcon } from '../components/icons/Icons'
import { useFetch } from '../hooks/useFetch'

// Link ảnh cho trang. Để trống ('') thì phần đó tự ẩn ảnh, trang vẫn hiển thị bình thường
const ABOUT_IMAGES = {
  banner: '', // ảnh nền khối tiêu đề trên cùng (ảnh ngang, rộng)
  story: '/images/about/banner.jpg', // ảnh bên cạnh đoạn giới thiệu
}

const bookingSteps = [
  { title: 'Chọn phim', text: 'Xem phim đang chiếu, phim sắp chiếu và thông tin chi tiết từng phim.' },
  { title: 'Chọn suất chiếu', text: 'Chọn rạp, ngày và giờ chiếu phù hợp với bạn.' },
  { title: 'Chọn ghế', text: 'Chọn tối đa 8 ghế trên sơ đồ phòng chiếu, ghế được giữ trong 5 phút.' },
  { title: 'Xác nhận đặt vé', text: 'Kiểm tra lại thông tin và nhận vé điện tử ngay lập tức.' },
]

// Tiêu đề khối, cùng kiểu với "Phim đang chiếu" ở trang chủ
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

function AboutPage() {
  // Số liệu lấy thật từ hệ thống, không ghi cứng
  const { data: cinemas, loading: loadingCinemas } = useFetch(() => getActiveCinemas(), [])
  const { data: nowShowing } = useFetch(() => getMovies({ status: 'now_showing' }), [])

  const stats = [
    { value: cinemas ? String(cinemas.length) : '...', label: 'Rạp chiếu' },
    { value: nowShowing ? String(nowShowing.length) : '...', label: 'Phim đang chiếu' },
    { value: '5 phút', label: 'Giữ ghế khi đặt' },
    { value: '24/7', label: 'Đặt vé trực tuyến' },
  ]

  return (
    <div>
      {/* Khối tiêu đề: có ảnh banner thì ảnh phủ kín cả khối, thêm lớp màu tối cho chữ dễ đọc */}
      <section className={`relative overflow-hidden ${ABOUT_IMAGES.banner ? 'bg-navy' : 'bg-navy-pattern'}`}>
        {ABOUT_IMAGES.banner && (
          <>
            <img src={ABOUT_IMAGES.banner} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-navy/70" />
          </>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-14 text-center text-white md:py-20">
          <p className="text-lg font-semibold uppercase tracking-[0.3em] text-sky">Cinema Booking</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Giới thiệu</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Hệ thống rạp chiếu phim với trải nghiệm đặt vé trực tuyến nhanh chóng, thuận tiện.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        {/* Về chúng tôi */}
        <section className="py-12">
          <SectionTitle>Về chúng tôi</SectionTitle>
          <div className={`mt-8 grid items-center gap-8 ${ABOUT_IMAGES.story ? 'md:grid-cols-2' : ''}`}>
            <div className="space-y-4 text-lg leading-relaxed text-navy/80">
              <p>
                <span className="font-semibold text-navy">Cinema Booking</span> là hệ thống rạp chiếu phim hướng tới
                trải nghiệm xem phim hiện đại: phòng chiếu tiêu chuẩn, âm thanh sống động và nhiều loại ghế để bạn lựa
                chọn, từ ghế thường, ghế VIP đến ghế đôi.
              </p>
              <p>
                Chúng tôi mang toàn bộ quá trình mua vé lên môi trường trực tuyến. Chỉ với vài thao tác, bạn có thể xem
                lịch chiếu, chọn chỗ ngồi yêu thích trên sơ đồ phòng chiếu và nhận vé điện tử ngay lập tức.
              </p>
              <p>
                Lịch chiếu được cập nhật liên tục với các bộ phim Việt Nam và quốc tế mới nhất, để mỗi lần đến rạp là
                một trải nghiệm trọn vẹn cùng gia đình và bạn bè.
              </p>
            </div>
            {ABOUT_IMAGES.story && (
              <img
                src={ABOUT_IMAGES.story}
                alt="Rạp chiếu phim Cinema Booking"
                className="aspect-video w-full rounded-lg object-cover shadow-md"
              />
            )}
          </div>
        </section>

        {/* Số liệu */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="bg-navy-pattern rounded-lg px-4 py-8 text-center text-white shadow-sm">
              <p className="text-4xl font-bold text-sky">{item.value}</p>
              <p className="mt-2 text-lg text-white/80">{item.label}</p>
            </div>
          ))}
        </section>

        {/* Vì sao chọn chúng tôi: dùng chung component, icon và nội dung nằm trong WhyChooseUs */}
        <WhyChooseUs />

        {/* Các bước đặt vé */}
        <section className="pb-12">
          <SectionTitle>Đặt vé chỉ với 4 bước</SectionTitle>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bookingSteps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sky text-xl font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="mt-1 text-navy/70">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Hệ thống rạp: lấy từ danh sách rạp đang hoạt động */}
        <section className="pb-12">
          <SectionTitle>Hệ thống rạp</SectionTitle>
          <div className="mt-8">
            {loadingCinemas && <p className="text-lg text-navy/60">Đang tải...</p>}
            {cinemas && cinemas.length === 0 && <p className="text-lg text-navy/60">Hệ thống rạp đang được cập nhật.</p>}
            {cinemas && cinemas.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cinemas.map((cinema) => (
                  <li key={cinema.id} className="rounded-lg bg-white p-5 shadow-sm">
                    <p className="text-lg font-bold text-title">{cinema.name}</p>
                    <p className="mt-1 text-navy/70">{cinema.address}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Kêu gọi đặt vé */}
        <section className="mb-12 rounded-lg bg-white px-6 py-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold md:text-3xl">Sẵn sàng cho buổi xem phim tiếp theo?</h2>
          <p className="mt-2 text-lg text-navy/70">Khám phá các bộ phim đang chiếu và đặt vé ngay hôm nay.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded bg-title px-8 py-3 text-lg font-semibold text-white transition hover:bg-navy"
          >
            Xem phim đang chiếu
          </Link>
        </section>
      </div>
    </div>
  )
}

export default AboutPage