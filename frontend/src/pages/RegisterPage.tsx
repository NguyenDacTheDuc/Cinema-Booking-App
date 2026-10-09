import { Fragment, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate } from 'react-router'
import { getErrorMessage } from '../api/axiosClient'
import { EyeIcon, EyeOffIcon } from '../components/icons/Icons'
import { useAuth } from '../hooks/useAuth'
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

interface BirthDateInputProps {
  value: string // "dd/mm/yyyy", có thể đang nhập dở, ví dụ "22/1/"
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: (el: HTMLInputElement | null) => void
}

// Ô ngày sinh chia 3 phần dd / mm / yyyy giống ô ngày của trình duyệt:
// bấm vào phần nào thì nhập số phần đó, nhập đủ số thì tự nhảy sang phần sau.
// Icon lịch bên phải: bấm mới hiện lịch.
function BirthDateInput({ value, onChange, onBlur, inputRef }: BirthDateInputProps) {
  const [focused, setFocused] = useState(false)
  const dayRef = useRef<HTMLInputElement | null>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)
  // Ô chọn ngày có sẵn của trình duyệt, ẩn đi, chỉ dùng để bật lịch khi bấm icon
  const pickerRef = useRef<HTMLInputElement>(null)

  const [day = '', month = '', year = ''] = value.split('/')
  const parts = [day, month, year]

  // firstDigitMax: gõ 1 số lớn hơn số này thì tự thêm số 0 phía trước (gõ "5" ở ngày -> "05")
  const segments = [
    { ref: dayRef, placeholder: 'dd', length: 2, firstDigitMax: 3, width: 'w-[2.6ch]' },
    { ref: monthRef, placeholder: 'mm', length: 2, firstDigitMax: 1, width: 'w-[2.8ch]' },
    { ref: yearRef, placeholder: 'yyyy', length: 4, firstDigitMax: 9, width: 'w-[4.6ch]' },
  ]

  function handleChange(index: number, raw: string) {
    const segment = segments[index]
    let digits = raw.replace(/\D/g, '').slice(0, segment.length)
    if (digits.length === 1 && Number(digits) > segment.firstDigitMax) digits = `0${digits}`

    const next = [...parts]
    next[index] = digits
    onChange(next.some(Boolean) ? next.join('/') : '')

    // Nhập đủ số thì nhảy sang phần tiếp theo
    if (digits.length === segment.length) segments[index + 1]?.ref.current?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    // Xóa hết một phần mà bấm Backspace tiếp thì lùi về phần trước
    if (e.key === 'Backspace' && parts[index] === '' && index > 0) {
      e.preventDefault()
      segments[index - 1].ref.current?.focus()
      return
    }
    // Bấm "/" thì nhảy sang phần sau; các phím chữ khác thì bỏ qua, chỉ cho nhập số
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (e.key === '/' && parts[index] !== '') segments[index + 1]?.ref.current?.focus()
    }
  }

  function openDatePicker() {
    const picker = pickerRef.current
    if (!picker) return
    picker.value = toIsoDate(value) ?? ''
    try {
      picker.showPicker()
    } catch {
      // Trình duyệt quá cũ không hỗ trợ thì vẫn nhập số được
    }
  }

  // Chưa bấm vào và chưa nhập gì thì chỉ hiện chữ "Ngày sinh"
  const showLabel = !focused && value === ''

  return (
    <div
      className="relative"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Chỉ tính là rời ô khi con trỏ ra hẳn ngoài cả cụm dd/mm/yyyy và icon
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false)
          onBlur()
        }
      }}
    >
      <div
        // Bấm vào chỗ trống trong ô thì bắt đầu nhập từ phần ngày
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault()
            dayRef.current?.focus()
          }
        }}
        className="flex w-full cursor-text items-center rounded border border-gray-300 bg-white px-4 py-2.5 pr-12 text-lg focus-within:border-sky focus-within:ring-2 focus-within:ring-sky/40"
      >
        {showLabel && <span className="pointer-events-none absolute left-[17px] text-gray-400">Ngày sinh</span>}

        <div className={`flex items-center ${showLabel ? 'pointer-events-none opacity-0' : ''}`}>
          {segments.map((segment, index) => (
            <Fragment key={segment.placeholder}>
              {index > 0 && <span className="px-0.5">/</span>}
              <input
                ref={
                  index === 0
                    ? (el) => {
                        dayRef.current = el
                        inputRef(el)
                      }
                    : segment.ref
                }
                type="text"
                inputMode="numeric"
                placeholder={segment.placeholder}
                value={parts[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                // Vào phần nào thì bôi đen cả phần đó, gõ số mới sẽ thay số cũ
                onFocus={(e) => e.target.select()}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.currentTarget.focus()
                  e.currentTarget.select()
                }}
                className={`${segment.width} h-7 rounded-sm bg-transparent p-0 text-center placeholder:text-gray-400 focus:bg-sky/25 focus:outline-none`}
              />
            </Fragment>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={openDatePicker}
        className="absolute inset-y-0 right-0 px-3 text-navy/70 hover:text-navy"
        aria-label="Chọn ngày sinh trên lịch"
      >
        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Ô chọn ngày ẩn, đặt sát mép phải với độ rộng gần bằng lịch
          để lịch bật ra ngay dưới ô, mép phải thẳng hàng mép phải ô nhập */}
      <input
        ref={pickerRef}
        type="date"
        min={MIN_BIRTH_DATE}
        max={MAX_BIRTH_DATE}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.value) onChange(toDisplayDate(e.target.value))
        }}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-64 border-0 p-0 opacity-0"
      />
    </div>
  )
}

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
      .refine((value) => {
        const iso = toIsoDate(value)
        return iso !== null && iso >= MIN_BIRTH_DATE && iso <= MAX_BIRTH_DATE
      }, 'Ngày sinh không hợp lệ (dd/mm/yyyy)'),
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