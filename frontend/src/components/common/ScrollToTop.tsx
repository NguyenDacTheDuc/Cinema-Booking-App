import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

// Chuyển sang trang khác (bấm link, navigate) thì cuộn lên đầu trang mới.
// - Bấm Back/Forward (POP): không cuộn, để trình duyệt giữ vị trí cũ
// - Chỉ đổi ?query trên cùng trang (lọc rạp, ngày...): không cuộn vì pathname không đổi
function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const previousPath = useRef(pathname)

  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}

export default ScrollToTop