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
import MovieManagementPage from './pages/admin/MovieManagementPage'
import CinemaManagementPage from './pages/admin/CinemaManagementPage'
import CinemaRoomsPage from './pages/admin/CinemaRoomsPage'
import RoomSeatsPage from './pages/admin/RoomSeatsPage'
import BookingManagementPage from './pages/admin/BookingManagementPage'
import ShowtimeManagementPage from './pages/admin/ShowtimeManagementPage'
import PrivateRoute from './components/auth/PrivateRoute'
import AccountLayout from './components/layout/AccountLayout'
import ChangePasswordPage from './pages/account/ChangePasswordPage'
import MyTicketsPage from './pages/account/MyTicketsPage'
import ProfilePage from './pages/account/ProfilePage'
import AboutPage from './pages/AboutPage'
import MovieDetailPage from './pages/MovieDetailPage'
import ShowtimesPage from './pages/ShowtimesPage'
import BookingPage from './pages/BookingPage'

function App() {
  return (
    <Routes>
      {/* Các trang dành cho khách hàng dùng chung header, menu, footer */}
      <Route element={<MainLayout />}>
        {/* index: trang mặc định khi vào http://localhost:5173/ */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="movie/:slug" element={<MovieDetailPage />} />
        <Route path="showtimes" element={<ShowtimesPage />} />
        <Route path="showtime/:slug" element={<ShowtimesPage />} />
        <Route path="booking/:showtimeId" element={<BookingPage />} />
        {/* Trang Tài khoản: phải đăng nhập mới vào được */}
        <Route element={<PrivateRoute />}>
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<Navigate to="tickets" replace />} />
            <Route path="tickets" element={<MyTicketsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="password" element={<ChangePasswordPage />} />
          </Route>
        </Route>
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
          <Route path="movies" element={<MovieManagementPage />} />
          <Route path="cinemas" element={<CinemaManagementPage />} />
          <Route path="cinemas/:cinemaId" element={<CinemaRoomsPage />} />
          <Route path="cinemas/:cinemaId/rooms/:roomId" element={<RoomSeatsPage />} />
          <Route path="showtimes" element={<ShowtimeManagementPage />} />
          <Route path="bookings" element={<BookingManagementPage />} />
          {/* Các trang quản lý chưa làm tạm hiện dòng thông báo */}
          <Route path="*" element={<p className="text-lg text-navy/60">Chức năng này đang được xây dựng.</p>} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App