import { useEffect } from 'react'

interface NoticeModalProps {
  title: string
  message: string
  buttonLabel?: string
  onClose: () => void
}

// Thông báo nổi giữa màn hình (ghế bị người khác giữ, hết thời gian giữ ghế, thanh toán lỗi...).
// Đóng khi bấm nút, bấm ra ngoài hoặc nhấn Esc
function NoticeModal({ title, message, buttonLabel = 'Đã hiểu', onClose }: NoticeModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl">
        <p className="text-xl font-bold">{title}</p>
        <p className="mt-3 text-navy/70">{message}</p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-6 rounded bg-title px-8 py-2.5 font-semibold text-white transition hover:bg-navy"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}

export default NoticeModal