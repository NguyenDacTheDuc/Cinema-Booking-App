import { Outlet } from 'react-router'
import Footer from './Footer'
import Header from './Header'

// Khung chung cho các trang khách hàng. <Outlet /> là chỗ nội dung từng trang được hiển thị
function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
