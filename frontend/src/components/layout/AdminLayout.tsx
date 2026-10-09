import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { FilmIcon } from '../icons/Icons'

const adminMenu = [
  { label: 'Khách hàng', to: '/admin/users' },
  { label: 'Phim', to: '/admin/movies' },
  { label: 'Thể loại', to: '/admin/genres' },
  { label: 'Rạp chiếu', to: '/admin/cinemas' },
  { label: 'Loại ghế', to: '/admin/seat-types' },
  { label: 'Suất chiếu', to: '/admin/showtimes' },
  { label: 'Đơn đặt vé', to: '/admin/bookings' },
]

// Khung chung cho các trang quản trị: menu bên trái, thanh trên cùng, nội dung bên phải
function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream md:flex-row">
      <aside className="bg-navy-pattern shrink-0 text-white md:w-64">
        <Link to="/admin/users" className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <FilmIcon className="size-9 text-sky" />
          <span className="leading-none">
            <span className="block text-xl font-bold text-sky">CINEMA</span>
            <span className="block text-xs font-semibold tracking-[0.3em] text-amber-300">QUẢN TRỊ</span>
          </span>
        </Link>

        {/* Điện thoại: menu nằm ngang, vuốt để xem thêm. Máy tính: menu dọc bên trái */}
        <nav className="flex overflow-x-auto md:flex-col md:overflow-visible md:py-4">
          {adminMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 border-b-4 px-5 py-3 text-lg transition md:border-b-0 md:border-l-4 md:px-6 ${
                  isActive ? 'border-sky bg-white/10 text-sky' : 'border-transparent hover:bg-white/5 hover:text-sky'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 bg-white px-6 py-4 shadow-sm">
          <span className="text-lg">
            Xin chào, <span className="font-semibold text-title">{user?.fullName}</span>
          </span>
          <Link to="/" className="text-lg text-title hover:underline">
            Xem trang khách hàng
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="border border-sky px-5 py-2 text-lg text-sky transition hover:bg-sky hover:text-white"
          >
            Đăng xuất
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout