import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/axiosClient'
import { createGenre, deleteGenre, getAllGenres, updateGenre } from '../../api/genreApi'
import Modal from '../../components/admin/Modal'
import { useFetch } from '../../hooks/useFetch'
import type { AdminGenre } from '../../types/genre'

// ======================= Form thêm / sửa =======================

const genreSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên thể loại').max(100, 'Tên thể loại tối đa 100 ký tự'),
  status: z.enum(['active', 'inactive']),
})

type GenreForm = z.infer<typeof genreSchema>

interface GenreFormModalProps {
  genre: AdminGenre | null // null: thêm mới, có giá trị: sửa thể loại đó
  onClose: () => void
  onSaved: () => void
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

function GenreFormModal({ genre, onClose, onSaved }: GenreFormModalProps) {
  const isEditing = genre !== null
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GenreForm>({
    resolver: zodResolver(genreSchema),
    defaultValues: { name: genre?.name ?? '', status: genre?.status ?? 'active' },
  })

  async function onSubmit(data: GenreForm) {
    setServerError(null)
    try {
      if (isEditing) {
        await updateGenre(genre.id, data)
      } else {
        // Thể loại mới luôn ở trạng thái đang dùng
        await createGenre({ name: data.name })
      }
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title={isEditing ? 'Sửa thể loại' : 'Thêm thể loại'} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="genre-name" className="mb-1 block font-semibold">
            Tên thể loại
          </label>
          <input id="genre-name" type="text" autoFocus {...register('name')} className={inputClass} />
          {errors.name && <p className="mt-1 text-red-600">{errors.name.message}</p>}
        </div>

        {/* Chỉ khi sửa mới đổi được trạng thái */}
        {isEditing && (
          <div>
            <label htmlFor="genre-status" className="mb-1 block font-semibold">
              Trạng thái
            </label>
            <select id="genre-status" {...register('status')} className={inputClass}>
              <option value="active">Đang dùng</option>
              <option value="inactive">Ngừng dùng (ẩn với khách hàng)</option>
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

// ======================= Trang quản lý thể loại =======================

function GenreManagementPage() {
  // Tăng số này để tải lại danh sách sau khi thêm, sửa, xóa
  const [reloadKey, setReloadKey] = useState(0)
  const { data: genres, loading, error } = useFetch(() => getAllGenres(), [reloadKey])

  // undefined: form đang đóng; null: đang thêm mới; có giá trị: đang sửa thể loại đó
  const [formGenre, setFormGenre] = useState<AdminGenre | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openForm(genre: AdminGenre | null) {
    setActionError(null)
    setFormGenre(genre)
  }

  // Lưu xong: đóng form và tải lại bảng (không hiện thông báo, nhìn bảng là thấy thay đổi)
  function handleSaved() {
    setFormGenre(undefined)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete(genre: AdminGenre) {
    if (!window.confirm(`Xóa thể loại "${genre.name}"?`)) return

    setActionError(null)
    setDeletingId(genre.id)
    try {
      await deleteGenre(genre.id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const rows = genres ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quản lý thể loại</h1>
          <p className="mt-2 text-lg text-navy/70">Thể loại ngừng dùng sẽ bị ẩn khỏi trang khách hàng.</p>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="rounded bg-title px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-navy"
        >
          + Thêm thể loại
        </button>
      </div>

      {/* Chỉ báo lỗi (ví dụ xóa thể loại đang được phim dùng); thành công thì không hiện gì */}
      {actionError && <p className="mt-4 rounded bg-red-50 px-4 py-3 text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-x-auto rounded bg-white shadow-sm">
        {/* Chỉ hiện "Đang tải" lần đầu; khi tải lại vẫn giữ bảng cũ cho khỏi nháy */}
        {loading && !genres && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {genres && rows.length === 0 && <p className="p-6 text-lg text-navy/60">Chưa có thể loại nào.</p>}

        {rows.length > 0 && (
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Tên thể loại</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((genre, index) => {
                const isActive = genre.status === 'active'
                return (
                  <tr key={genre.id} className="border-t border-gray-200 hover:bg-cream">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{genre.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isActive ? 'Đang dùng' : 'Ngừng dùng'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openForm(genre)}
                          className="rounded border border-title px-4 py-1.5 text-title transition hover:bg-title hover:text-white"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(genre)}
                          disabled={deletingId === genre.id}
                          className="rounded border border-red-500 px-4 py-1.5 text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          {deletingId === genre.id ? 'Đang xóa...' : 'Xóa'}
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

      {formGenre !== undefined && (
        <GenreFormModal genre={formGenre} onClose={() => setFormGenre(undefined)} onSaved={handleSaved} />
      )}
    </div>
  )
}

export default GenreManagementPage