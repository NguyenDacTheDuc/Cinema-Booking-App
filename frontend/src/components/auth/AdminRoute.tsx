import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

// Chặn các trang /admin: chỉ admin mới vào được
function AdminRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Đang kiểm tra token đã lưu (vừa mở web hoặc F5), chưa biết là ai
  if (loading) {
    return <p className="p-10 text-center text-lg text-navy/60">Đang tải...</p>
  }

  // Chưa đăng nhập: sang trang đăng nhập, đăng nhập xong quay lại đúng trang này
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Khách hàng cố vào trang quản trị: đưa về trang chủ
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute