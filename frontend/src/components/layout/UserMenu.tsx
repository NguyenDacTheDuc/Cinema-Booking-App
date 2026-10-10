import { startTransition, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import UserAvatar from '../common/UserAvatar'
import { ChevronDownIcon, LogoutIcon } from '../icons/Icons'
import { accountMenu } from './accountMenu'

// Nút tài khoản trên header: ảnh đại diện + tên, bấm vào hiện menu thả xuống
function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Đang mở menu: bấm ra ngoài hoặc nhấn Esc thì đóng
  useEffect(() => {
    if (!open) return

    function handleMouseDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!user) return null

  // Chuyển về trang chủ và xóa đăng nhập trong cùng một lần cập nhật giao diện.
  // Nếu xóa đăng nhập trước, đang ở trang Tài khoản sẽ bị PrivateRoute đẩy sang trang Đăng nhập
  function handleLogout() {
    setOpen(false)
    startTransition(() => {
      navigate('/')
      logout()
    })
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-3 text-lg text-sky transition hover:bg-white/10"
      >
        <UserAvatar fullName={user.fullName} avatar={user.avatar} />
        <span className="font-semibold">{user.fullName}</span>
        <ChevronDownIcon className={`size-5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg bg-white text-navy shadow-xl ring-1 ring-black/5"
        >
          {/* Đang đăng nhập bằng tài khoản nào */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
            <UserAvatar fullName={user.fullName} avatar={user.avatar} className="size-12 text-xl" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.fullName}</p>
              <p className="truncate text-sm text-navy/60">{user.email}</p>
            </div>
          </div>

          <div className="py-2">
            {accountMenu.map(({ label, to, Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-lg transition hover:bg-cream hover:text-title"
              >
                <Icon className="size-5 text-navy/60" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-200 py-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-lg text-red-600 transition hover:bg-red-50"
            >
              <LogoutIcon className="size-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu