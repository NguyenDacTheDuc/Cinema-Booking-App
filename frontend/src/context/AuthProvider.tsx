import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../api/authApi'
import { TOKEN_KEY } from '../api/axiosClient'
import type { LoginInput, User } from '../types/auth'
import { AuthContext } from './authContext'

// Bọc toàn bộ app để mọi trang, mọi component đều biết ai đang đăng nhập
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // Có token đã lưu thì phải hỏi backend trước mới biết còn đăng nhập hay không
  const [loading, setLoading] = useState(() => localStorage.getItem(TOKEN_KEY) !== null)

  // Mở web (hoặc F5): nếu đã có token thì lấy lại thông tin người dùng.
  // Token hết hạn hoặc tài khoản bị khóa thì backend báo lỗi, ta xóa token đi.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return

    authApi
      .getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  async function login(input: LoginInput) {
    const result = await authApi.login(input)
    localStorage.setItem(TOKEN_KEY, result.token)
    setUser(result.user)
    return result.user
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export default AuthProvider