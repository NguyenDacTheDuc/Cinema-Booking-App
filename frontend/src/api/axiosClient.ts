import axios from 'axios'

// Địa chỉ backend. Có thể đổi bằng biến VITE_API_URL trong file frontend/.env
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const TOKEN_KEY = 'token'

const axiosClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Tự gắn token đăng nhập (nếu có) vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Lấy câu thông báo lỗi tiếng Việt mà backend trả về (AppError)
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message
    if (message) return message
    if (!error.response) return 'Không kết nối được tới máy chủ, vui lòng thử lại sau'
  }
  return 'Đã có lỗi xảy ra, vui lòng thử lại'
}

export default axiosClient
