import { Link } from 'react-router'

// Hiển thị khi vào đường dẫn chưa có trang (các trang chưa làm cũng tạm hiện trang này)
function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <h1 className="text-5xl font-bold text-navy">404</h1>
      <p className="mt-4 text-xl">Trang bạn tìm không tồn tại hoặc đang được xây dựng.</p>
      <Link
        to="/"
        className="mt-8 inline-block border border-sky bg-sky px-8 py-2.5 text-lg text-white hover:bg-sky-dark"
      >
        Về trang chủ
      </Link>
    </div>
  )
}

export default NotFoundPage
