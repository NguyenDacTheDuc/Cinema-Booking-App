import { useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { changePassword } from '../../api/authApi'
import { getErrorMessage } from '../../api/axiosClient'
import { EyeIcon, EyeOffIcon } from '../../components/icons/Icons'

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmNewPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.newPassword === '' || data.newPassword !== data.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  })

type PasswordForm = z.infer<typeof passwordSchema>

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 pr-12 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'
const labelClass = 'mb-1 block font-semibold'

const fields = [
  { name: 'currentPassword', label: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password' },
  { name: 'confirmNewPassword', label: 'Nhập lại mật khẩu mới', autoComplete: 'new-password' },
] as const

function ChangePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  async function onSubmit(data: PasswordForm) {
    setServerError(null)
    setDone(false)
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      reset()
      setDone(true)
    } catch (err) {
      const message = getErrorMessage(err)
      // Lỗi 400 từ backend là nhập sai mật khẩu hiện tại: báo ngay dưới ô đó.
      // Gắn vào ô nên khi sửa lại ô này, lỗi tự mất như các lỗi kiểm tra khác
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError('currentPassword', { type: 'server', message })
      } else {
        setServerError(message)
      }
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Đổi mật khẩu</h1>
      <p className="mt-2 text-lg text-navy/70">Mật khẩu mới phải có ít nhất 6 ký tự và khác mật khẩu hiện tại.</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => setServerError(null)}
        noValidate
        className="mt-6 max-w-xl rounded-lg bg-white p-6 shadow-sm md:p-8"
      >
        <div className="space-y-5">
          {fields.map((field, index) => (
            <div key={field.name}>
              <label htmlFor={`password-${field.name}`} className={labelClass}>
                {field.label}
              </label>
              <div className="relative">
                <input
                  id={`password-${field.name}`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={field.autoComplete}
                  {...register(field.name)}
                  className={inputClass}
                />
                {/* Một nút ẩn/hiện ở ô đầu tiên, áp dụng cho cả 3 ô */}
                {index === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-navy/70 hover:text-navy"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                )}
              </div>
              {errors[field.name] && <p className="mt-1 text-red-600">{errors[field.name]?.message}</p>}
            </div>
          ))}
        </div>

        {serverError && <p className="mt-5 text-red-600">{serverError}</p>}
        {/* Đổi mật khẩu không có gì để nhìn thấy thay đổi, nên báo ngắn gọn; nhập tiếp thì tự ẩn */}
        {done && !isDirty && <p className="mt-5 text-green-700">Đổi mật khẩu thành công.</p>}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-title px-6 py-2.5 text-lg font-semibold text-white transition hover:bg-navy disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChangePasswordPage