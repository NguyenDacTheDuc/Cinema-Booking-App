import { Link } from 'react-router'
import { FilmIcon } from '../icons/Icons'

// Thông tin rạp: thay bằng thông tin thật của bạn
const cinemaInfo = {
  name: 'HỆ THỐNG RẠP CHIẾU PHIM CINEMA BOOKING',
  address: 'Hà Nội, Việt Nam',
  phone: '0123.456.789',
  email: 'contact@cinemabooking.vn',
}

const CURRENT_YEAR = new Date().getFullYear()

// Trang nào chưa làm thì để to rỗng (tạm chưa bấm được)
const policyLinks = [
  { label: 'Chính sách bảo mật', to: '/privacy-policy' },
  { label: 'Điều khoản sử dụng', to: '/terms' },
  { label: 'Hướng dẫn đặt vé', to: '/booking-guide' },
]

function Footer() {
  return (
    <footer className="bg-navy-pattern border-t-2 border-sky text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:flex-row md:gap-6">
        {/* Logo dạng dải ruy băng */}
        <div
          className="hidden h-44 w-36 shrink-0 items-start justify-center bg-sky pt-6 md:flex"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)' }}
        >
          <FilmIcon className="size-20 text-white" />
        </div>

        <div className="flex-1 py-6">
          <ul className="flex flex-wrap gap-x-12 gap-y-2 text-xl font-light">
            {policyLinks.map((link) => (
              <li key={link.label}>
                {link.to ? (
                  <Link to={link.to} className="hover:text-sky">
                    {link.label}
                  </Link>
                ) : (
                  <span className="cursor-default">{link.label}</span>
                )}
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-2xl font-bold">{cinemaInfo.name}</h3>
          <div className="mt-4 space-y-2 text-lg">
            <p>
              <span className="font-bold">Địa chỉ:</span> {cinemaInfo.address}
            </p>
            <p>
              <span className="font-bold">Điện thoại:</span>{' '}
              <a href={`tel:${cinemaInfo.phone.replaceAll('.', '')}`} className="text-sky hover:underline">
                {cinemaInfo.phone}
              </a>
            </p>
            <p>
              <span className="font-bold">Email:</span>{' '}
              <a href={`mailto:${cinemaInfo.email}`} className="text-sky hover:underline">
                {cinemaInfo.email}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Dòng bản quyền nằm chung nền xanh đậm, ngăn cách bằng 1 đường mờ */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-1 px-4 py-4 text-lg text-white/80 sm:flex-row">
          <p>Copyright © {CURRENT_YEAR} - All rights reserved</p>
          <p>
            Developed by <span className="text-sky">Nguyễn Đắc Thế Đức</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer