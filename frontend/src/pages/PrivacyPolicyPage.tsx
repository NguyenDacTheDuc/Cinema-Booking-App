import { Link } from 'react-router'
import LegalPage, { BulletList, legalLinkClass as linkClass, type LegalSection } from '../components/common/LegalPage'

// Thông tin đơn vị: giống phần chân trang và trang Liên hệ
const company = {
  name: 'Hệ thống rạp chiếu phim Cinema Booking',
  address: 'Hà Nội, Việt Nam',
  phone: '0123.456.789',
  email: 'contact@cinemabooking.vn',
}

// Nội dung chính sách, khớp với dữ liệu hệ thống thật sự thu thập và cách lưu trữ
const sections: LegalSection[] = [
  {
    id: 'thu-thap',
    title: 'Thông tin chúng tôi thu thập',
    content: (
      <>
        <p>Khi bạn đăng ký tài khoản và sử dụng dịch vụ đặt vé, chúng tôi thu thập các thông tin sau:</p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Thông tin tài khoản',
              text: 'Họ tên, email, số điện thoại, ngày sinh, giới tính và ảnh đại diện (nếu có).',
            },
            {
              title: 'Thông tin đặt vé',
              text: 'Phim, suất chiếu, rạp, ghế đã chọn, số tiền và thời điểm đặt vé.',
            },
            {
              title: 'Thông tin liên hệ',
              text: 'Nội dung bạn gửi qua trang Liên hệ, như góp ý hoặc yêu cầu hỗ trợ.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border-t-4 border-sky bg-cream p-4">
              <p className="font-bold text-navy">{item.title}</p>
              <p className="mt-1 text-base">{item.text}</p>
            </div>
          ))}
        </div>
        <p>
          Chúng tôi <span className="font-semibold text-navy">không thu thập và không lưu trữ</span> thông tin thẻ ngân
          hàng hay tài khoản thanh toán của bạn.
        </p>
      </>
    ),
  },
  {
    id: 'muc-dich',
    title: 'Mục đích sử dụng thông tin',
    content: (
      <BulletList
        items={[
          'Tạo và quản lý tài khoản, xác thực khi bạn đăng nhập.',
          'Xử lý đặt vé, giữ ghế, xuất vé điện tử và lưu lịch sử đặt vé của bạn.',
          'Hỗ trợ, giải đáp thắc mắc và xử lý khiếu nại liên quan đến vé đã đặt.',
          'Thông báo các thay đổi quan trọng về suất chiếu hoặc dịch vụ khi cần thiết.',
          'Phát hiện và ngăn chặn các hành vi gian lận, sử dụng trái phép tài khoản.',
        ]}
      />
    ),
  },
  {
    id: 'bao-mat',
    title: 'Lưu trữ và bảo mật thông tin',
    content: (
      <BulletList
        items={[
          'Mật khẩu được mã hóa một chiều trước khi lưu, không ai (kể cả quản trị viên) xem được mật khẩu gốc của bạn.',
          'Phiên đăng nhập dùng mã xác thực có thời hạn 7 ngày, hết hạn bạn cần đăng nhập lại.',
          'Chỉ quản trị viên được cấp quyền mới truy cập được thông tin khách hàng và chỉ để phục vụ vận hành dịch vụ.',
          'Thông tin được lưu trữ trong suốt thời gian tài khoản còn hoạt động hoặc đến khi bạn yêu cầu xóa.',
        ]}
      />
    ),
  },
  {
    id: 'chia-se',
    title: 'Chia sẻ thông tin',
    content: (
      <>
        <p>
          Chúng tôi cam kết không bán, trao đổi hay cung cấp thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào, trừ các
          trường hợp:
        </p>
        <BulletList
          items={[
            'Có sự đồng ý của bạn.',
            'Theo yêu cầu của cơ quan nhà nước có thẩm quyền, theo quy định của pháp luật.',
            'Để bảo vệ quyền lợi hợp pháp của khách hàng và của Cinema Booking khi có tranh chấp.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'quyen-loi',
    title: 'Quyền của khách hàng',
    content: (
      <BulletList
        items={[
          <>
            Xem và cập nhật thông tin cá nhân bất cứ lúc nào tại{' '}
            <Link to="/account/profile" className={linkClass}>
              Hồ sơ cá nhân
            </Link>
            .
          </>,
          <>
            Đổi mật khẩu tại{' '}
            <Link to="/account/password" className={linkClass}>
              Đổi mật khẩu
            </Link>{' '}
            khi nghi ngờ tài khoản bị lộ.
          </>,
          <>
            Xem lại toàn bộ vé đã đặt tại{' '}
            <Link to="/account/tickets" className={linkClass}>
              Vé của tôi
            </Link>
            .
          </>,
          'Yêu cầu xóa tài khoản và dữ liệu cá nhân bằng cách liên hệ với chúng tôi theo thông tin bên dưới.',
        ]}
      />
    ),
  },
  {
    id: 'thay-doi',
    title: 'Thay đổi chính sách',
    content: (
      <p>
        Chính sách này có thể được cập nhật để phù hợp với hoạt động của dịch vụ và quy định pháp luật. Mọi thay đổi sẽ
        được đăng tại trang này kèm ngày cập nhật. Việc bạn tiếp tục sử dụng dịch vụ sau khi chính sách thay đổi đồng
        nghĩa với việc bạn chấp nhận các thay đổi đó.
      </p>
    ),
  },
  {
    id: 'lien-he',
    title: 'Phản hồi và khiếu nại',
    content: (
      <>
        <p>
          Mọi ý kiến, câu hỏi hoặc khiếu nại liên quan đến thông tin cá nhân, vui lòng gửi về email{' '}
          <a href={`mailto:${company.email}`} className={linkClass}>
            {company.email}
          </a>{' '}
          hoặc qua trang{' '}
          <Link to="/contact" className={linkClass}>
            Liên hệ
          </Link>
          . Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
        </p>
      </>
    ),
  },
]

// Lời mở đầu và thông tin đơn vị quản lý dữ liệu
const intro = (
  <>
    <p>Kính chào quý khách hàng,</p>
    <p>
      <span className="font-semibold text-navy">Cinema Booking</span> tôn trọng quyền riêng tư của khách hàng và cam kết
      bảo vệ thông tin cá nhân bạn cung cấp khi sử dụng website, tuân thủ các quy định của pháp luật Việt Nam về bảo vệ
      dữ liệu cá nhân. Chính sách dưới đây giải thích rõ thông tin nào được thu thập, dùng để làm gì và bạn có những
      quyền gì đối với thông tin của mình.
    </p>
    <div className="rounded-lg bg-navy-pattern p-5 text-base text-white md:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky">Đơn vị thu thập và quản lý thông tin</p>
      <p className="mt-2 text-xl font-bold uppercase">{company.name}</p>
      <dl className="mt-3 flex flex-col gap-1 text-lg text-white/85 sm:flex-row sm:flex-wrap sm:gap-x-8">
        <div>
          <dt className="inline font-semibold text-white">Địa chỉ: </dt>
          <dd className="inline">{company.address}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-white">Điện thoại: </dt>
          <dd className="inline">
            <a href={`tel:${company.phone.replaceAll('.', '')}`} className="text-sky hover:underline">
              {company.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold text-white">Email: </dt>
          <dd className="inline">
            <a href={`mailto:${company.email}`} className="break-all text-sky hover:underline">
              {company.email}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  </>
)

function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Chính sách bảo mật"
      subtitle="Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn."
      lastUpdated="11/10/2026"
      intro={intro}
      sections={sections}
    />
  )
}

export default PrivacyPolicyPage