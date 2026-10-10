import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateMe } from '../../api/authApi'
import { getErrorMessage } from '../../api/axiosClient'
import BirthDateInput from '../../components/common/BirthDateInput'
import UserAvatar from '../../components/common/UserAvatar'
import { useAuth } from '../../hooks/useAuth'
import type { User } from '../../types/auth'
import { isValidBirthDate, toDisplayDate, toIsoDate } from '../../utils/birthDate'

// Khớp với validator đăng ký ở backend
const profileSchema = z.object({
  fullName: z.string().trim().min(8, 'Vui lòng nhập tên đầy đủ'),
  phone: z.string().trim().regex(/^0\d{9}$/, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0'),
  dateOfBirth: z
    .string()
    .min(1, 'Vui lòng nhập ngày sinh')
    .refine(isValidBirthDate, 'Ngày sinh không hợp lệ (dd/mm/yyyy)'),
  gender: z.enum(['', 'male', 'female', 'other']),
  avatar: z
    .string()
    .trim()
    .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), 'Link ảnh phải bắt đầu bằng http:// hoặc https://'),
})

type ProfileForm = z.infer<typeof profileSchema>

// Dữ liệu người dùng -> giá trị ban đầu của form
function toFormValues(user: User): ProfileForm {
  const gender = user.gender === 'male' || user.gender === 'female' || user.gender === 'other' ? user.gender : ''
  return {
    fullName: user.fullName,
    phone: user.phone,
    dateOfBirth: toDisplayDate(user.dateOfBirth.slice(0, 10)),
    gender,
    avatar: user.avatar ?? '',
  }
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'
const labelClass = 'mb-1 block font-semibold'

// Form tách riêng để chỉ hiện khi đã có thông tin người dùng
function ProfileFormCard({ user }: { user: User }) {
  const { updateUser } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(user),
  })

  // Xem trước ảnh đại diện ngay khi đang sửa
  const previewAvatar = useWatch({ control, name: 'avatar' })
  const previewName = useWatch({ control, name: 'fullName' })

  async function onSubmit(data: ProfileForm) {
    setServerError(null)
    setSaved(false)
    try {
      const updated = await updateMe({
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: toIsoDate(data.dateOfBirth) ?? '',
        // Để trống thì không gửi, backend giữ nguyên
        ...(data.gender && { gender: data.gender }),
        ...(data.avatar && { avatar: data.avatar }),
      })
      // Cập nhật luôn tên, ảnh trên header
      updateUser(updated)
      reset(toFormValues(updated))
      setSaved(true)
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 rounded-lg bg-white p-6 shadow-sm md:p-8">
      {/* Ảnh đại diện */}
      <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-center">
        <UserAvatar
          fullName={previewName || user.fullName}
          avatar={previewAvatar.trim() || null}
          className="size-24 text-4xl"
        />
        <div className="flex-1">
          <label htmlFor="profile-avatar" className={labelClass}>
            Ảnh đại diện
          </label>
          <input
            id="profile-avatar"
            type="url"
            placeholder="Dán link ảnh, ví dụ https://..."
            {...register('avatar')}
            className={inputClass}
          />
          {errors.avatar ? (
            <p className="mt-1 text-red-600">{errors.avatar.message}</p>
          ) : (
            <p className="mt-1 text-sm text-navy/60">Để trống thì hiện chữ cái đầu của tên.</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className={labelClass}>
            Họ và tên
          </label>
          <input id="profile-name" type="text" autoComplete="name" {...register('fullName')} className={inputClass} />
          {errors.fullName && <p className="mt-1 text-red-600">{errors.fullName.message}</p>}
        </div>

        <div>
          <label htmlFor="profile-email" className={labelClass}>
            Email
          </label>
          {/* Email dùng để đăng nhập nên không cho đổi */}
          <input
            id="profile-email"
            type="email"
            value={user.email}
            disabled
            className={`${inputClass} cursor-not-allowed bg-gray-100 text-navy/60`}
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className={labelClass}>
            Số điện thoại
          </label>
          <input id="profile-phone" type="tel" autoComplete="tel" {...register('phone')} className={inputClass} />
          {errors.phone && <p className="mt-1 text-red-600">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="profile-gender" className={labelClass}>
            Giới tính
          </label>
          <select id="profile-gender" {...register('gender')} className={inputClass}>
            <option value="">-- Chưa chọn --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div>
          <span className={labelClass}>Ngày sinh</span>
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <BirthDateInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} inputRef={field.ref} />
            )}
          />
          {errors.dateOfBirth && <p className="mt-1 text-red-600">{errors.dateOfBirth.message}</p>}
        </div>
      </div>

      {serverError && <p className="mt-6 text-red-600">{serverError}</p>}

      <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
        {/* Sửa hồ sơ không có bảng để nhìn thay đổi, nên báo ngắn gọn; sửa tiếp thì tự ẩn */}
        {saved && !isDirty && <p className="text-green-700">Đã lưu thay đổi.</p>}
        <button
          type="button"
          onClick={() => reset()}
          disabled={!isDirty || isSubmitting}
          className="rounded border border-gray-300 px-5 py-2.5 text-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Hoàn tác
        </button>
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="rounded bg-title px-6 py-2.5 text-lg font-semibold text-white transition hover:bg-navy disabled:opacity-50 disabled:hover:bg-title"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div>
      <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
      <p className="mt-2 text-lg text-navy/70">Quản lý thông tin cá nhân của bạn.</p>
      <ProfileFormCard user={user} />
    </div>
  )
}

export default ProfilePage