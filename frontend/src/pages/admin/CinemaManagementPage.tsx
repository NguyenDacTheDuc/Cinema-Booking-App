import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/axiosClient'
import { createCinema, deleteCinema, getAllCinemas, updateCinema } from '../../api/cinemaApi'
import Modal from '../../components/admin/Modal'
import { useFetch } from '../../hooks/useFetch'
import type { Cinema } from '../../types/cinema'

// ======================= Form thêm / sửa =======================

const cinemaSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên rạp').max(150, 'Tên rạp tối đa 150 ký tự'),
  address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ rạp').max(255, 'Địa chỉ tối đa 255 ký tự'),
  status: z.enum(['active', 'inactive']),
})

type CinemaForm = z.infer<typeof cinemaSchema>

interface CinemaFormModalProps {
  cinema: Cinema | null // null: thêm mới, có giá trị: sửa rạp đó
  onClose: () => void
  onSaved: () => void
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

function CinemaFormModal({ cinema, onClose, onSaved }: CinemaFormModalProps) {
  const isEditing = cinema !== null
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CinemaForm>({
    resolver: zodResolver(cinemaSchema),
    defaultValues: { name: cinema?.name ?? '', address: cinema?.address ?? '', status: cinema?.status ?? 'active' },
  })

  async function onSubmit(data: CinemaForm) {
    setServerError(null)
    try {
      if (isEditing) {
        await updateCinema(cinema.id, data)
      } else {
        // Rạp mới luôn ở trạng thái hoạt động
        await createCinema({ name: data.name, address: data.address })
      }
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title={isEditing ? 'Sửa rạp' : 'Thêm rạp'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="cinema-name" className="mb-1 block font-semibold">
            Tên rạp
          </label>
          <input id="cinema-name" type="text" autoFocus {...register('name')} className={inputClass} />
          {errors.name && <p className="mt-1 text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="cinema-address" className="mb-1 block font-semibold">
            Địa chỉ
          </label>
          <input id="cinema-address" type="text" {...register('address')} className={inputClass} />
          {errors.address && <p className="mt-1 text-red-600">{errors.address.message}</p>}
        </div>

        {/* Chỉ khi sửa mới đổi được trạng thái */}
        {isEditing && (
          <div>
            <label htmlFor="cinema-status" className="mb-1 block font-semibold">
              Trạng thái
            </label>
            <select id="cinema-status" {...register('status')} className={inputClass}>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động (ẩn với khách hàng)</option>
            </select>
          </div>
        )}

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

// ======================= Trang quản lý rạp =======================

function CinemaManagementPage() {
  // Tăng số này để tải lại danh sách sau khi thêm, sửa, xóa
  const [reloadKey, setReloadKey] = useState(0)
  const { data: cinemas, loading, error } = useFetch(() => getAllCinemas(), [reloadKey])

  // undefined: form đang đóng; null: đang thêm mới; có giá trị: đang sửa rạp đó
  const [formCinema, setFormCinema] = useState<Cinema | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openForm(cinema: Cinema | null) {
    setActionError(null)
    setFormCinema(cinema)
  }

  // Lưu xong: đóng form và tải lại bảng (không hiện thông báo, nhìn bảng là thấy thay đổi)
  function handleSaved() {
    setFormCinema(undefined)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete(cinema: Cinema) {
    if (!window.confirm(`Xóa rạp "${cinema.name}"?`)) return

    setActionError(null)
    setDeletingId(cinema.id)
    try {
      await deleteCinema(cinema.id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const rows = cinemas ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý rạp chiếu</h1>
          <p className="mt-2 text-lg text-navy/70">Bấm "Phòng chiếu" để quản lý phòng và sơ đồ ghế của từng rạp.</p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="rounded bg-title px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-navy"
        >
          + Thêm rạp
        </button>
      </div>

      {/* Chỉ báo lỗi (ví dụ xóa rạp đang có phòng); thành công thì không hiện gì */}
      {actionError && <p className="mt-4 rounded bg-red-50 px-4 py-3 text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-x-auto rounded bg-white shadow-sm">
        {/* Chỉ hiện "Đang tải" lần đầu; khi tải lại vẫn giữ bảng cũ cho khỏi nháy */}
        {loading && !cinemas && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {cinemas && rows.length === 0 && <p className="p-6 text-lg text-navy/60">Chưa có rạp nào.</p>}

        {rows.length > 0 && (
          <table className="w-full min-w-[800px] text-left">
            <thead className="whitespace-nowrap bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Tên rạp</th>
                <th className="px-4 py-3 font-semibold">Địa chỉ</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((cinema, index) => {
                const isActive = cinema.status === 'active'
                return (
                  <tr key={cinema.id} className="border-t border-gray-200 hover:bg-cream">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{cinema.name}</td>
                    <td className="px-4 py-3">{cinema.address}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2 whitespace-nowrap">
                        <Link
                          to={`/admin/cinemas/${cinema.id}`}
                          className="rounded border border-navy px-4 py-1.5 text-navy transition hover:bg-navy hover:text-white"
                        >
                          Phòng chiếu
                        </Link>
                        <button
                          type="button"
                          onClick={() => openForm(cinema)}
                          className="rounded border border-title px-4 py-1.5 text-title transition hover:bg-title hover:text-white"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cinema)}
                          disabled={deletingId === cinema.id}
                          className="rounded border border-red-500 px-4 py-1.5 text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          {deletingId === cinema.id ? 'Đang xóa...' : 'Xóa'}
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

      {formCinema !== undefined && (
        <CinemaFormModal cinema={formCinema} onClose={() => setFormCinema(undefined)} onSaved={handleSaved} />
      )}
    </div>
  )
}

export default CinemaManagementPage