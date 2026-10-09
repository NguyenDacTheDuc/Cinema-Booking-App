/* deps do nơi gọi truyền vào nên công cụ kiểm tra code (oxlint) không tự xác định được,
   tắt cảnh báo exhaustive-deps cho riêng file này */
/* oxlint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { getErrorMessage } from '../api/axiosClient'

// Gọi API khi component hiển thị (và gọi lại khi deps thay đổi),
// tự quản lý 3 trạng thái: đang tải, dữ liệu, lỗi.
// Ví dụ: const { data, loading, error } = useFetch(() => getMovies(), [])
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Bỏ kết quả của lần gọi cũ nếu deps đổi trước khi API trả về
    let ignore = false
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!ignore) setData(result)
      })
      .catch((err: unknown) => {
        if (!ignore) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, deps)

  return { data, loading, error }
}
