import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { getErrorMessage } from '../api/axiosClient'
import { useAuth } from '../hooks/useAuth'

// Kiểm tra dữ liệu ngay trên trình duyệt trước khi gửi lên backend
const loginSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').pipe(z.email('Email không hợp lệ')),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginForm = z.infer<typeof loginSchema>

const inputClass =
  'w-full rounded border border-gray-300 bg-blue-50 px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  // Trang trước đó (nếu bị chuyển tới đây vì chưa đăng nhập), không có thì về trang chủ
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  // Đã đăng nhập rồi thì không cần ở trang này
  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  async function onSubmit(data: LoginForm) {
    setServerError(null)
    try {
      await login(data)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-5xl">Đăng nhập</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-6">
        <div>
          <input type="email" placeholder="Email" autoComplete="email" {...register('email')} className={inputClass} />
          {errors.email && <p className="mt-1 text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Mật khẩu"
            autoComplete="current-password"
            {...register('password')}
            className={inputClass}
          />
          {errors.password && <p className="mt-1 text-red-600">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-center text-red-600">{serverError}</p>}

        <div className="flex flex-col items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-title px-6 py-2.5 text-lg font-semibold text-white transition hover:bg-navy disabled:opacity-60"
          >
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <Link to="/forgot-password" className="text-lg text-title hover:underline">
            Khôi phục mật khẩu
          </Link>
        </div>
      </form>
    </div>
  )
}

export default LoginPage