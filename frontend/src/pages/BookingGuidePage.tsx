import { Link } from 'react-router'
import LegalPage, { BulletList, NoteBox, legalLinkClass as linkClass, type LegalSection } from '../components/common/LegalPage'

// Chú thích màu ghế, cùng màu với sơ đồ ghế ở trang chọn ghế
const seatLegend = [
  { label: 'Ghế thường', className: 'bg-gray-200' },
  { label: 'Ghế VIP', className: 'bg-amber-400' },
  { label: 'Ghế bạn chọn', className: 'bg-sky ring-2 ring-sky-dark ring-offset-1' },
  { label: 'Người khác đang giữ', className: 'bg-[repeating-linear-gradient(45deg,#cbd5e1_0_4px,#e2e8f0_4px_8px)]' },
  { label: 'Đã bán', className: 'bg-navy/75' },
]

const buttonClass =
  'inline-block rounded bg-title px-6 py-2.5 font-semibold text-white transition hover:bg-navy'
const outlineButtonClass =
  'inline-block rounded border border-title px-6 py-2.5 font-semibold text-title transition hover:bg-title hover:text-white'

// Các bước đặt vé, khớp với luồng thật trên website
const sections: LegalSection[] = [
  {
    id: 'tai-khoan',
    title: 'Đăng nhập hoặc đăng ký tài khoản',
    content: (
      <>
        <p>
          Bạn cần có tài khoản thành viên để đặt vé. Chưa đăng nhập bạn vẫn xem được phim, lịch chiếu và sơ đồ ghế; khi
          bấm chọn ghế, hệ thống sẽ chuyển sang trang đăng nhập và đưa bạn quay lại đúng suất chiếu sau khi đăng nhập.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/register" className={buttonClass}>
            Đăng ký
          </Link>
          <Link to="/login" className={outlineButtonClass}>
            Đăng nhập
          </Link>
        </div>
      </>
    ),
  },
  {
    id: 'chon-phim',
    title: 'Chọn phim',
    content: (
      <BulletList
        items={[
          'Tại trang chủ, xem danh sách phim đang chiếu, phim sắp chiếu hoặc gõ tên phim vào ô tìm kiếm trên đầu trang.',
          'Bấm vào poster hoặc tên phim để xem nội dung, thời lượng, phân loại độ tuổi và trailer.',
          <>
            Bấm nút <span className="font-semibold text-navy">Mua vé</span> để xem các suất chiếu của phim đó.
          </>,
        ]}
      />
    ),
  },
  {
    id: 'chon-suat',
    title: 'Chọn rạp, ngày và suất chiếu',
    content: (
      <>
        <BulletList
          items={[
            'Chọn rạp và ngày chiếu (hiển thị lịch chiếu của 7 ngày tới), sau đó bấm vào giờ chiếu phù hợp.',
            'Suất chiếu bị làm mờ là suất đã ngừng bán vé trực tuyến (trước giờ chiếu 15 phút).',
            <>
              Muốn nhanh hơn, dùng thanh <span className="font-semibold text-navy">Mua vé nhanh</span> ở trang chủ để chọn
              phim, rạp và ngày cùng lúc.
            </>,
          ]}
        />
        <Link to="/showtimes" className={outlineButtonClass}>
          Xem lịch chiếu
        </Link>
      </>
    ),
  },
  {
    id: 'chon-ghe',
    title: 'Chọn ghế',
    content: (
      <>
        <BulletList
          items={[
            'Bấm vào ghế trống trên sơ đồ phòng chiếu để chọn, bấm lại lần nữa để bỏ chọn.',
            'Mỗi lần đặt được chọn tối đa 8 ghế, giá vé tính theo từng loại ghế.',
            'Ghế bạn chọn được giữ riêng trong 5 phút, đồng hồ đếm ngược hiển thị ngay bên dưới sơ đồ.',
          ]}
        />
        {/* Chú thích màu ghế giống trang chọn ghế */}
        <div className="rounded-lg bg-cream p-5">
          <p className="font-bold text-navy">Ý nghĩa màu ghế</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-base">
            {seatLegend.map((seat) => (
              <span key={seat.label} className="flex items-center gap-2">
                <span className={`h-5 w-6 rounded-t-md ${seat.className}`} aria-hidden="true" />
                {seat.label}
              </span>
            ))}
          </div>
        </div>
        <NoteBox>
          Hết 5 phút mà chưa thanh toán, ghế sẽ tự động được nhả cho khách khác và bạn cần chọn lại. Mỗi tài khoản chỉ giữ
          ghế ở một suất chiếu tại một thời điểm.
        </NoteBox>
      </>
    ),
  },
  {
    id: 'thanh-toan',
    title: 'Thanh toán',
    content: (
      <>
        <BulletList
          items={[
            <>
              Bấm <span className="font-semibold text-navy">Thanh toán</span> ở thanh tóm tắt bên dưới sơ đồ ghế.
            </>,
            'Kiểm tra lại ghế, tổng tiền và thông tin khách hàng, chọn phương thức thanh toán.',
            <>
              Đánh dấu đồng ý điều khoản, bấm <span className="font-semibold text-navy">Xác nhận thanh toán</span> để nhận
              mã QR, quét mã bằng ứng dụng ngân hàng hoặc ví điện tử rồi bấm{' '}
              <span className="font-semibold text-navy">Tôi đã thanh toán</span>.
            </>,
          ]}
        />
        <NoteBox>
          Website đang vận hành ở chế độ <span className="font-semibold">thanh toán mô phỏng</span>, không phát sinh giao
          dịch tiền thật.
        </NoteBox>
      </>
    ),
  },
  {
    id: 'nhan-ve',
    title: 'Nhận vé điện tử',
    content: (
      <>
        <p>
          Thanh toán thành công, vé điện tử hiển thị ngay với <span className="font-semibold text-navy">mã đặt vé</span>{' '}
          và <span className="font-semibold text-navy">mã QR</span>. Bạn có thể xem lại bất cứ lúc nào tại{' '}
          <Link to="/account/tickets" className={linkClass}>
            Vé của tôi
          </Link>
          .
        </p>
        {/* Ví dụ mã đặt vé */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-navy-pattern px-5 py-4 text-white">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-sky">Ví dụ mã đặt vé</span>
          <span className="font-mono text-2xl font-bold tracking-[0.15em]">CB7K2M9QXA</span>
        </div>
        <BulletList
          items={[
            'Có mặt tại rạp trước giờ chiếu ít nhất 15 phút.',
            'Đưa mã QR hoặc mã đặt vé cho nhân viên tại quầy để vào phòng chiếu, không cần in vé.',
            'Vé đã thanh toán không hỗ trợ đổi hoặc hoàn tiền.',
          ]}
        />
      </>
    ),
  },
]

const intro = (
  <>
    <p>
      Đặt vé tại <span className="font-semibold text-navy">Cinema Booking</span> chỉ mất vài phút. Làm theo 6 bước dưới
      đây để chọn phim, chọn ghế và nhận vé điện tử ngay trên website.
    </p>
    <div className="flex flex-wrap gap-3">
      <Link to="/showtimes" className={buttonClass}>
        Đặt vé ngay
      </Link>
      <Link to="/terms" className={outlineButtonClass}>
        Xem điều khoản sử dụng
      </Link>
    </div>
  </>
)

function BookingGuidePage() {
  return (
    <LegalPage
      title="Hướng dẫn đặt vé"
      subtitle="Đặt vé xem phim trực tuyến chỉ với 6 bước đơn giản."
      lastUpdated="11/10/2026"
      intro={intro}
      sections={sections}
    />
  )
}

export default BookingGuidePage