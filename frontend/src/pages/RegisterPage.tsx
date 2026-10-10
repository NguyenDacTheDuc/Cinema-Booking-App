import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate } from 'react-router'
import { getErrorMessage } from '../api/axiosClient'
import BirthDateInput from '../components/common/BirthDateInput'
import { EyeIcon, EyeOffIcon } from '../components/icons/Icons'
import { useAuth } from '../hooks/useAuth'
import { isValidBirthDate, toIsoDate } from '../utils/birthDate'
import { getHomePath } from '../utils/redirect'

// Lấy ngày hôm nay (hoặc lùi lại vài năm) dạng "YYYY-MM-DD"
function getDateString(yearsAgo = 0) {
  const date = new Date()
  date.setFullYear(date.getFullYear() - yearsAgo)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// "22/11/2004" -> "2004-11-22". Sai định dạng hoặc ngày không có thật (31/02...) -> null
function toIsoDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const isRealDate =
    date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
  return isRealDate ? `${year}-${month}-${day}` : null
}

// "2004-11-22" -> "22/11/2004" để hiển thị
function toDisplayDate(iso: string) {
  return iso.split('-').reverse().join('/')
}

// Ngày sinh chỉ được chọn trong khoảng 100 năm trước tới hôm nay
const MIN_BIRTH_DATE = getDateString(100)
const MAX_BIRTH_DATE = getDateString()

// Kiểm tra dữ liệu ngay trên trình duyệt, khớp với validator đăng ký ở backend
const registerSchema = z
  .object({
    email: z.string().trim().min(1, 'Vui lòng nhập email').pipe(z.email('Email không hợp lệ')),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    fullName: z.string().trim().min(8, 'Vui lòng nhập tên đầy đủ'),
    phone: z.string().trim().regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0'),
    dateOfBirth: z
      .string()
      .min(1, 'Vui lòng nhập ngày sinh')
      // Ô nhập dạng dd/mm/yyyy: phải là ngày có thật và nằm trong khoảng cho phép
      .refine(isValidBirthDate, 'Ngày sinh không hợp lệ (dd/mm/yyyy)'),
  })
  // Hai ô mật khẩu phải giống nhau, báo lỗi ở ô "Nhập lại mật khẩu"
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

function RegisterPage() {
  const { user, register: registerAccount } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { dateOfBirth: '' },
  })

  // Đã đăng nhập (kể cả ngay sau khi đăng ký thành công) thì chuyển trang
  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  async function onSubmit(data: RegisterForm) {
    setServerError(null)
    try {
      // Không gửi confirmPassword; ngày sinh đổi từ dd/mm/yyyy sang YYYY-MM-DD cho backend
      const { confirmPassword: _confirmPassword, dateOfBirth, ...rest } = data
      await registerAccount({ ...rest, dateOfBirth: toIsoDate(dateOfBirth) ?? '' })
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  const passwordType = showPassword ? 'text' : 'password'

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-5xl">Đăng ký</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-6">
        <div>
          <input type="email" placeholder="Email" autoComplete="email" {...register('email')} className={inputClass} />
          {errors.email && <p className="mt-1 text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <div className="relative">
            <input
              type={passwordType}
              placeholder="Mật khẩu"
              autoComplete="new-password"
              {...register('password')}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 px-3 text-navy/70 hover:text-navy"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <input
            type={passwordType}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={inputClass}
          />
          {errors.confirmPassword && <p className="mt-1 text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <div>
          <input type="text" placeholder="Họ và tên" autoComplete="name" {...register('fullName')} className={inputClass} />
          {errors.fullName && <p className="mt-1 text-red-600">{errors.fullName.message}</p>}
        </div>

        <div>
          <input
            type="tel"
            placeholder="Số điện thoại"
            autoComplete="tel"
            {...register('phone')}
            className={inputClass}
          />
          {errors.phone && <p className="mt-1 text-red-600">{errors.phone.message}</p>}
        </div>

        <div>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <BirthDateInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref} />
            )}
          />
          {errors.dateOfBirth && <p className="mt-1 text-red-600">{errors.dateOfBirth.message}</p>}
        </div>

        {serverError && <p className="text-center text-red-600">{serverError}</p>}

        <div className="text-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-title px-6 py-2.5 text-lg font-semibold text-white transition hover:bg-navy disabled:opacity-60"
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RegisterPage