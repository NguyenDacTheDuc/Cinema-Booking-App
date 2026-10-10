import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../hooks/useAuth'

// Chặn các trang cần đăng nhập (trang Tài khoản, đặt vé...): khách hàng hay admin đều vào được
function PrivateRoute() {
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

  return <Outlet />
}

export default PrivateRoute