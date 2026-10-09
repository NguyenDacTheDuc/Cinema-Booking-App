import { Fragment } from 'react'
import { NavLink } from 'react-router'

const menuItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Giới thiệu', to: '/about' },
  { label: 'Lịch chiếu', to: '/showtimes' },
  { label: 'Giá vé', to: '/ticket-prices' },
  { label: 'Liên hệ', to: '/contact' },
]

function NavBar() {
  return (
    <nav className="bg-white shadow-sm">
      <ul className="mx-auto flex max-w-7xl items-center justify-between overflow-x-auto px-4">
        {menuItems.map((item, index) => (
          <Fragment key={item.to}>
            {/* Dấu gạch chéo ngăn cách giữa các mục menu */}
            {index > 0 && (
              <li aria-hidden="true" className="h-10 w-px shrink-0 rotate-[20deg] bg-navy/70" />
            )}
            <li className="shrink-0">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block border-t-4 px-6 py-5 text-lg font-semibold uppercase transition md:px-10 ${
                    isActive ? 'border-sky text-sky' : 'border-transparent text-navy hover:text-sky'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          </Fragment>
        ))}
      </ul>
    </nav>
  )
}

export default NavBar
