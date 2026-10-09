import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/axiosClient'
import { createSeatType, deleteSeatType, getSeatTypes, updateSeatType } from '../../api/seatTypeApi'
import Modal from '../../components/admin/Modal'
import { useFetch } from '../../hooks/useFetch'
import type { SeatType } from '../../types/seatType'

// Loại ghế mặc định (id = 1, "thường"): phòng mới tự sinh ghế đều dùng loại này,
// backend không cho xóa (khớp với DEFAULT_SEAT_TYPE_ID ở backend)
const DEFAULT_SEAT_TYPE_ID = 1

// 75000 hoặc "75000.00" -> "75.000 ₫"
function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString('vi-VN')} ₫`
}

// ======================= Form thêm / sửa =======================

const seatTypeSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên loại ghế').max(50, 'Tên loại ghế tối đa 50 ký tự'),
  // Ô giá để trống thì giá trị là NaN, zod báo "Vui lòng nhập giá vé"
  price: z
    .number('Vui lòng nhập giá vé')
    .int('Giá vé phải là số nguyên')
    .positive('Giá vé phải lớn hơn 0')
    .max(10_000_000, 'Giá vé tối đa 10.000.000 ₫'),
})

type SeatTypeForm = z.infer<typeof seatTypeSchema>

interface SeatTypeFormModalProps {
  seatType: SeatType | null // null: thêm mới, có giá trị: sửa loại ghế đó
  onClose: () => void
  onSaved: () => void
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

function SeatTypeFormModal({ seatType, onClose, onSaved }: SeatTypeFormModalProps) {
  const isEditing = seatType !== null
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeatTypeForm>({
    resolver: zodResolver(seatTypeSchema),
    defaultValues: seatType ? { name: seatType.name, price: Number(seatType.price) } : { name: '' },
  })

  async function onSubmit(data: SeatTypeForm) {
    setServerError(null)
    try {
      if (isEditing) {
        await updateSeatType(seatType.id, data)
      } else {
        await createSeatType(data)
      }
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title={isEditing ? 'Sửa loại ghế' : 'Thêm loại ghế'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="seat-type-name" className="mb-1 block font-semibold">
            Tên loại ghế
          </label>
          <input id="seat-type-name" type="text" autoFocus {...register('name')} className={inputClass} />
          {errors.name && <p className="mt-1 text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="seat-type-price" className="mb-1 block font-semibold">
            Giá vé (₫)
          </label>
          <input
            id="seat-type-price"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            {...register('price', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.price && <p className="mt-1 text-red-600">{errors.price.message}</p>}
          {isEditing && (
            <p className="mt-1 text-sm text-navy/60">Đổi giá chỉ áp dụng cho vé đặt sau này, vé đã đặt giữ nguyên giá cũ.</p>
          )}
        </div>

        {serverError && <p className="text-red-600">{serverError}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-5 py-2 hover:bg-gray-100">
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-title px-5 py-2 font-semibold text-white transition hover:bg-navy disabled:opacity-60"
          >
            {isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ======================= Trang quản lý loại ghế =======================

function SeatTypeManagementPage() {
  // Tăng số này để tải lại danh sách sau khi thêm, sửa, xóa
  const [reloadKey, setReloadKey] = useState(0)
  const { data: seatTypes, loading, error } = useFetch(() => getSeatTypes(), [reloadKey])

  // undefined: form đang đóng; null: đang thêm mới; có giá trị: đang sửa loại ghế đó
  const [formSeatType, setFormSeatType] = useState<SeatType | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openForm(seatType: SeatType | null) {
    setActionError(null)
    setFormSeatType(seatType)
  }

  // Lưu xong: đóng form và tải lại bảng (không hiện thông báo, nhìn bảng là thấy thay đổi)
  function handleSaved() {
    setFormSeatType(undefined)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete(seatType: SeatType) {
    if (!window.confirm(`Xóa loại ghế "${seatType.name}"?`)) return

    setActionError(null)
    setDeletingId(seatType.id)
    try {
      await deleteSeatType(seatType.id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const rows = seatTypes ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý loại ghế</h1>
          <p className="mt-2 text-lg text-navy/70">Giá vé của mỗi ghế tính theo loại ghế.</p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="rounded bg-title px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-navy"
        >
          + Thêm loại ghế
        </button>
      </div>

      {/* Chỉ báo lỗi (ví dụ xóa loại ghế đang được dùng); thành công thì không hiện gì */}
      {actionError && <p className="mt-4 rounded bg-red-50 px-4 py-3 text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-x-auto rounded bg-white shadow-sm">
        {/* Chỉ hiện "Đang tải" lần đầu; khi tải lại vẫn giữ bảng cũ cho khỏi nháy */}
        {loading && !seatTypes && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {seatTypes && rows.length === 0 && <p className="p-6 text-lg text-navy/60">Chưa có loại ghế nào.</p>}

        {rows.length > 0 && (
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Tên loại ghế</th>
                <th className="px-4 py-3 text-right font-semibold">Giá vé</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((seatType, index) => {
                const isDefault = seatType.id === DEFAULT_SEAT_TYPE_ID
                return (
                  <tr key={seatType.id} className="border-t border-gray-200 hover:bg-cream">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{seatType.name}</span>
                      {isDefault && (
                        <span className="ml-2 rounded-full bg-sky/15 px-3 py-1 text-sm font-semibold text-title">
                          Mặc định
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{formatMoney(seatType.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openForm(seatType)}
                          className="rounded border border-title px-4 py-1.5 text-title transition hover:bg-title hover:text-white"
                        >
                          Sửa
                        </button>
                        {/* Loại mặc định không xóa được nên khóa nút luôn */}
                        <button
                          type="button"
                          onClick={() => handleDelete(seatType)}
                          disabled={isDefault || deletingId === seatType.id}
                          title={isDefault ? 'Không thể xóa loại ghế mặc định' : undefined}
                          className="rounded border border-red-500 px-4 py-1.5 text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red-600"
                        >
                          {deletingId === seatType.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {formSeatType !== undefined && (
        <SeatTypeFormModal seatType={formSeatType} onClose={() => setFormSeatType(undefined)} onSaved={handleSaved} />
      )}
    </div>
  )
}

export default SeatTypeManagementPage