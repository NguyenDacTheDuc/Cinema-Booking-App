import { Link } from 'react-router'
import LegalPage, { BulletList, NoteBox, legalLinkClass as linkClass, type LegalSection } from '../components/common/LegalPage'

const CONTACT_EMAIL = 'contact@cinemabooking.vn'

// Các bước đặt vé, khớp với luồng thật trên website
const bookingSteps = [
  { title: 'Chọn phim và suất chiếu', text: 'Chọn phim, rạp, ngày và giờ chiếu tại trang Lịch chiếu hoặc trang chi tiết phim.' },
  { title: 'Chọn ghế', text: 'Chọn ghế trên sơ đồ phòng chiếu, ghế được giữ riêng cho bạn trong 5 phút.' },
  { title: 'Thanh toán', text: 'Kiểm tra thông tin, chọn phương thức thanh toán và xác nhận.' },
  { title: 'Nhận vé điện tử', text: 'Vé có mã đặt vé và mã QR, xem lại bất cứ lúc nào tại mục Vé của tôi.' },
]

const ageRatings = [
  { code: 'P', text: 'Phim dành cho mọi lứa tuổi' },
  { code: 'K', text: 'Dưới 13 tuổi cần có người lớn đi kèm' },
  { code: 'T13', text: 'Từ đủ 13 tuổi trở lên' },
  { code: 'T16', text: 'Từ đủ 16 tuổi trở lên' },
  { code: 'T18', text: 'Từ đủ 18 tuổi trở lên' },
]

// Nội dung điều khoản, khớp với các quy định hệ thống đang áp dụng
const sections: LegalSection[] = [
  {
    id: 'tai-khoan',
    title: 'Tài khoản thành viên',
    content: (
      <BulletList
        items={[
          'Chức năng đặt vé trực tuyến chỉ áp dụng cho khách hàng có tài khoản thành viên Cinema Booking. Khách chưa đăng nhập vẫn xem được phim, lịch chiếu và sơ đồ ghế.',
          'Khi đăng ký, quý khách cần cung cấp thông tin chính xác và cập nhật khi có thay đổi.',
          'Quý khách tự chịu trách nhiệm bảo mật mật khẩu và mọi hoạt động trên tài khoản của mình. Khi nghi ngờ tài khoản bị truy cập trái phép, vui lòng đổi mật khẩu và báo ngay cho chúng tôi.',
          'Cinema Booking có quyền tạm khóa tài khoản có dấu hiệu gian lận hoặc vi phạm điều khoản này.',
        ]}
      />
    ),
  },
  {
    id: 'dat-ve',
    title: 'Quy định đặt vé trực tuyến',
    content: (
      <BulletList
        items={[
          'Lịch chiếu được hiển thị cho 7 ngày tới và được cập nhật liên tục.',
          'Hệ thống ngừng bán vé trực tuyến trước giờ chiếu 15 phút. Sau thời điểm này, quý khách vui lòng mua vé trực tiếp tại quầy.',
          'Mỗi lần đặt được chọn tối đa 8 ghế trong cùng một suất chiếu.',
          'Ghế được giữ trong 5 phút kể từ lần chọn ghế đầu tiên. Hết thời gian mà chưa thanh toán, ghế sẽ tự động được nhả cho khách khác.',
          'Mỗi tài khoản chỉ giữ ghế ở một suất chiếu tại một thời điểm.',
          <>
            Giá vé tính theo loại ghế và được chốt tại thời điểm thanh toán. Xem chi tiết tại{' '}
            <Link to="/ticket-prices" className={linkClass}>
              Bảng giá vé
            </Link>
            .
          </>,
        ]}
      />
    ),
  },
  {
    id: 'giao-dich',
    title: 'Thực hiện giao dịch',
    content: (
      <>
        <p>Khách hàng đăng nhập tài khoản và thực hiện đặt vé theo các bước sau:</p>
        <ol className="grid gap-4 sm:grid-cols-2">
          {bookingSteps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-lg bg-cream p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-title font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-bold text-navy">{step.title}</p>
                <p className="mt-1 text-base">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p>
          Tại rạp, quý khách xuất trình mã đặt vé hoặc mã QR trên vé điện tử cho nhân viên để vào phòng chiếu. Cinema
          Booking không chịu trách nhiệm trong trường hợp quý khách để lộ mã đặt vé cho người khác sử dụng.
        </p>
      </>
    ),
  },
  {
    id: 'thanh-toan',
    title: 'Thanh toán',
    content: (
      <>
        <p>Quý khách có thể lựa chọn một trong các phương thức thanh toán sau:</p>
        <BulletList
          items={['Ví điện tử.', 'Thẻ ATM nội địa / Internet Banking.', 'Thẻ quốc tế (Visa, Mastercard, JCB).']}
        />
        <p>
          Đơn đặt vé chỉ được xác nhận khi thanh toán thành công. Thông tin thanh toán được xử lý theo{' '}
          <Link to="/privacy-policy" className={linkClass}>
            Chính sách bảo mật
          </Link>
          , Cinema Booking không lưu trữ thông tin thẻ của quý khách.
        </p>
        <NoteBox>
          Website hiện đang vận hành ở chế độ <span className="font-semibold">thanh toán mô phỏng</span>: hệ thống không
          kết nối cổng thanh toán và không phát sinh giao dịch tiền thật.
        </NoteBox>
      </>
    ),
  },
  {
    id: 'doi-huy',
    title: 'Đổi, hủy và hoàn vé',
    content: (
      <BulletList
        items={[
          'Vé đã thanh toán không hỗ trợ đổi suất chiếu, đổi ghế, hủy vé hoặc hoàn tiền.',
          'Quý khách vui lòng kiểm tra kỹ phim, rạp, suất chiếu và ghế ngồi trước khi xác nhận thanh toán.',
          'Trường hợp suất chiếu bị hủy hoặc thay đổi từ phía rạp, chúng tôi sẽ liên hệ qua email hoặc số điện thoại đã đăng ký để hỗ trợ quý khách.',
        ]}
      />
    ),
  },
  {
    id: 'tai-rap',
    title: 'Quy định tại rạp',
    content: (
      <>
        <BulletList
          items={[
            'Vé chỉ có giá trị cho đúng suất chiếu, phòng chiếu và ghế ghi trên vé.',
            'Quý khách vui lòng có mặt trước giờ chiếu ít nhất 15 phút.',
            'Phim được phân loại theo độ tuổi. Rạp có quyền từ chối phục vụ khách hàng không đủ độ tuổi theo quy định, kể cả khi đã mua vé.',
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ageRatings.map((rating) => (
            <div key={rating.code} className="rounded-lg bg-cream p-3 text-center">
              <span className="inline-block rounded bg-red-600 px-2 py-0.5 text-sm font-bold text-white">{rating.code}</span>
              <p className="mt-2 text-base">{rating.text}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'trach-nhiem',
    title: 'Giới hạn trách nhiệm',
    content: (
      <BulletList
        items={[
          'Cinema Booking không chịu trách nhiệm với thiệt hại phát sinh do quý khách cung cấp sai thông tin hoặc không tuân thủ các quy định trên.',
          'Trong trường hợp hệ thống gián đoạn do sự cố kỹ thuật hoặc nguyên nhân khách quan, chúng tôi sẽ nỗ lực khắc phục sớm nhất và hỗ trợ quý khách hoàn tất giao dịch.',
        ]}
      />
    ),
  },
  {
    id: 'lien-he',
    title: 'Thay đổi điều khoản và liên hệ',
    content: (
      <p>
        Điều khoản có thể được cập nhật và có hiệu lực ngay khi đăng trên trang này. Mọi thắc mắc về điều khoản sử dụng,
        vui lòng gửi về email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
          {CONTACT_EMAIL}
        </a>{' '}
        hoặc qua trang{' '}
        <Link to="/contact" className={linkClass}>
          Liên hệ
        </Link>
        .
      </p>
    ),
  },
]

const intro = (
  <p>
    Xin vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ. Khi truy cập website và đặt vé tại{' '}
    <span className="font-semibold text-navy">Cinema Booking</span>, quý khách đồng ý tuân thủ các điều khoản sử dụng
    này. Quý khách nên thường xuyên xem lại trang này để cập nhật những thay đổi mới nhất.
  </p>
)

function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản sử dụng"
      subtitle="Quy định khi sử dụng website và dịch vụ đặt vé trực tuyến của Cinema Booking."
      lastUpdated="11/10/2026"
      intro={intro}
      sections={sections}
    />
  )
}

export default TermsPage