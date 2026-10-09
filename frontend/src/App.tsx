import { Navigate, Route, Routes } from 'react-router'
import AdminRoute from './components/auth/AdminRoute'
import AdminLayout from './components/layout/AdminLayout'
import MainLayout from './components/layout/MainLayout'
import UserManagementPage from './pages/admin/UserManagementPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/admin/DashboardPage'
import GenreManagementPage from './pages/admin/GenreManagementPage'
import SeatTypeManagementPage from './pages/admin/SeatTypeManagementPage'

function App() {
  return (
    <Routes>
      {/* Các trang dành cho khách hàng dùng chung header, menu, footer */}
      <Route element={<MainLayout />}>
        {/* index: trang mặc định khi vào http://localhost:5173/ */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Các trang quản trị: chỉ admin vào được, dùng khung AdminLayout riêng */}
      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          {/* Vào /admin thì chuyển sang trang Tổng quan */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="genres" element={<GenreManagementPage />} />
          <Route path="seat-types" element={<SeatTypeManagementPage />} />
          {/* Các trang quản lý chưa làm tạm hiện dòng thông báo */}
          <Route path="*" element={<p className="text-lg text-navy/60">Chức năng này đang được xây dựng.</p>} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App