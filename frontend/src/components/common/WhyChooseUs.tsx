import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { FilmIcon } from '../icons/Icons'

const iconProps = {
  className: 'size-7',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

// Lý do chọn Cinema Booking, khớp với các chức năng thật của hệ thống
const features: { title: string; text: ReactNode; icon: ReactNode }[] = [
  {
    title: 'Đặt vé nhanh chóng',
    text: 'Chọn phim, suất chiếu, ghế ngồi và thanh toán chỉ trong vài bước.',
    icon: (
      <svg {...iconProps}>
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    title: 'Chọn ghế trực quan',
    text: 'Sơ đồ ghế cập nhật liên tục, ghế bạn chọn được giữ trong 5 phút.',
    icon: (
      <svg {...iconProps}>
        <path d="M6 11V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" />
        <path d="M4 11h16v5H4zM6 16v4M18 16v4" />
      </svg>
    ),
  },
  {
    title: 'Vé điện tử QR',
    text: 'Nhận vé ngay sau khi thanh toán, đưa mã QR tại quầy là vào xem.',
    icon: (
      <svg {...iconProps}>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2" />
      </svg>
    ),
  },
  {
    title: 'Giá vé minh bạch',
    text: (
      <>
        Đồng giá vé thường cho mọi suất chiếu.{' '}
        <Link to="/ticket-prices" className="font-semibold text-title hover:underline">
          Xem bảng giá
        </Link>
      </>
    ),
    icon: (
      <svg {...iconProps}>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="8" cy="8" r="1.5" />
      </svg>
    ),
  },
]

// Khối "Vì sao chọn chúng tôi", dùng chung cho trang chủ và trang Giới thiệu.
// className: khoảng cách trên dưới của khối ở từng trang
function WhyChooseUs({ className = 'py-12' }: { className?: string }) {
  return (
    <section className={className}>
      <div className="border-b-2 border-sky">
        <h2 className="-mb-0.5 inline-flex items-center gap-2 border-b-[3px] border-navy pb-3 text-3xl font-bold uppercase md:text-4xl">
          <FilmIcon className="size-10" />
          Vì sao chọn chúng tôi
        </h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-lg border-t-4 border-sky bg-white p-6 shadow-sm">
            <span className="flex size-14 items-center justify-center rounded-full bg-sky/15 text-title">
              {feature.icon}
            </span>
            <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
            <p className="mt-2 text-navy/70">{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WhyChooseUs