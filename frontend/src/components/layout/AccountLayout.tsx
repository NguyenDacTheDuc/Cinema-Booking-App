import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import UserAvatar from '../common/UserAvatar'
import { accountMenu } from './accountMenu'

// Khung trang Tài khoản: menu bên trái (Vé của tôi, Hồ sơ, Đổi mật khẩu), nội dung bên phải
function AccountLayout() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start">
      <aside className="shrink-0 overflow-hidden rounded-lg bg-white shadow-sm md:sticky md:top-6 md:w-72">
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-5">
          <UserAvatar fullName={user.fullName} avatar={user.avatar} className="size-14 text-2xl" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user.fullName}</p>
            <p className="truncate text-sm text-navy/60">{user.email}</p>
          </div>
        </div>

        {/* Điện thoại: menu nằm ngang, vuốt để xem thêm. Máy tính: menu dọc */}
        <nav className="flex overflow-x-auto md:flex-col md:py-2">
          {accountMenu.map(({ label, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 border-b-4 px-5 py-3 text-lg transition md:border-b-0 md:border-l-4 ${
                  isActive ? 'border-sky bg-sky/10 font-semibold text-title' : 'border-transparent hover:bg-cream hover:text-title'
                }`
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  )
}

export default AccountLayout