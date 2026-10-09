import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/axiosClient'
import { getAllCinemas } from '../../api/cinemaApi'
import { createRoom, deleteRoom, getRoomsByCinema, updateRoom } from '../../api/roomApi'
import Modal from '../../components/admin/Modal'
import { useFetch } from '../../hooks/useFetch'
import type { Room } from '../../types/cinema'

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'

const roomName = z.string().trim().min(1, 'Vui lòng nhập tên phòng').max(100, 'Tên phòng tối đa 100 ký tự')

// ======================= Form thêm phòng =======================

const createRoomSchema = z.object({
  name: roomName,
  // Ô số để trống thì giá trị là NaN, zod báo lỗi "Vui lòng nhập..."
  rows: z.number('Vui lòng nhập số hàng').int('Số hàng phải là số nguyên').min(1, 'Ít nhất 1 hàng').max(26, 'Tối đa 26 hàng (A đến Z)'),
  columns: z
    .number('Vui lòng nhập số ghế mỗi hàng')
    .int('Số ghế phải là số nguyên')
    .min(1, 'Ít nhất 1 ghế mỗi hàng')
    .max(30, 'Tối đa 30 ghế mỗi hàng'),
})

type CreateRoomForm = z.infer<typeof createRoomSchema>

interface CreateRoomModalProps {
  cinemaId: number
  onClose: () => void
  onSaved: () => void
}

function CreateRoomModal({ cinemaId, onClose, onSaved }: CreateRoomModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: '' },
  })

  // Xem trước số ghế sẽ được tạo
  const rows = useWatch({ control, name: 'rows' })
  const columns = useWatch({ control, name: 'columns' })
  const isValidSize = Number.isInteger(rows) && Number.isInteger(columns) && rows >= 1 && rows <= 26 && columns >= 1 && columns <= 30
  const lastRowLabel = isValidSize ? String.fromCharCode(64 + rows) : ''

  async function onSubmit(data: CreateRoomForm) {
    setServerError(null)
    try {
      await createRoom({ ...data, cinemaId })
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title="Thêm phòng chiếu" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="room-name" className="mb-1 block font-semibold">
            Tên phòng
          </label>
          <input id="room-name" type="text" autoFocus placeholder="Ví dụ: Phòng 1" {...register('name')} className={inputClass} />
          {errors.name && <p className="mt-1 text-red-600">{errors.name.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="room-rows" className="mb-1 block font-semibold">
              Số hàng ghế
            </label>
            <input
              id="room-rows"
              type="number"
              inputMode="numeric"
              min={1}
              max={26}
              {...register('rows', { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.rows && <p className="mt-1 text-red-600">{errors.rows.message}</p>}
          </div>

          <div>
            <label htmlFor="room-columns" className="mb-1 block font-semibold">
              Số ghế mỗi hàng
            </label>
            <input
              id="room-columns"
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              {...register('columns', { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.columns && <p className="mt-1 text-red-600">{errors.columns.message}</p>}
          </div>
        </div>

        <p className="rounded bg-cream px-4 py-3 text-navy/70">
          {isValidSize
            ? `Sẽ tạo ${rows * columns} ghế: hàng A đến ${lastRowLabel}, mỗi hàng ${columns} ghế, tất cả là loại mặc định.`
            : 'Hệ thống tự tạo ghế theo số hàng và số ghế mỗi hàng.'}{' '}
          Sau khi tạo không đổi được kích thước phòng, chỉ đổi được loại ghế trong sơ đồ ghế.
        </p>

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
            {isSubmitting ? 'Đang tạo...' : 'Thêm'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ======================= Form sửa phòng =======================

const editRoomSchema = z.object({
  name: roomName,
  status: z.enum(['active', 'inactive']),
})

type EditRoomForm = z.infer<typeof editRoomSchema>

interface EditRoomModalProps {
  room: Room
  onClose: () => void
  onSaved: () => void
}

function EditRoomModal({ room, onClose, onSaved }: EditRoomModalProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditRoomForm>({
    resolver: zodResolver(editRoomSchema),
    defaultValues: { name: room.name, status: room.status },
  })

  async function onSubmit(data: EditRoomForm) {
    setServerError(null)
    try {
      await updateRoom(room.id, data)
      onSaved()
    } catch (err) {
      setServerError(getErrorMessage(err))
    }
  }

  return (
    <Modal title="Sửa phòng chiếu" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label htmlFor="room-name" className="mb-1 block font-semibold">
            Tên phòng
          </label>
          <input id="room-name" type="text" autoFocus {...register('name')} className={inputClass} />
          {errors.name && <p className="mt-1 text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="room-status" className="mb-1 block font-semibold">
            Trạng thái
          </label>
          <select id="room-status" {...register('status')} className={inputClass}>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động (không xếp suất chiếu được)</option>
          </select>
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
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ======================= Trang danh sách phòng của 1 rạp =======================

function CinemaRoomsPage() {
  const cinemaId = Number(useParams().cinemaId)

  // Lấy tên rạp để hiện tiêu đề (backend không có API xem 1 rạp cho admin nên tìm trong danh sách)
  const { data: cinemas } = useFetch(() => getAllCinemas(), [])
  const cinema = cinemas?.find((item) => item.id === cinemaId)

  // Tăng số này để tải lại danh sách sau khi thêm, sửa, xóa
  const [reloadKey, setReloadKey] = useState(0)
  const { data: rooms, loading, error } = useFetch(() => getRoomsByCinema(cinemaId), [cinemaId, reloadKey])

  // 'new': đang thêm phòng; Room: đang sửa phòng đó; null: không mở form
  const [formRoom, setFormRoom] = useState<Room | 'new' | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function openForm(room: Room | 'new') {
    setActionError(null)
    setFormRoom(room)
  }

  // Lưu xong: đóng form và tải lại bảng (không hiện thông báo, nhìn bảng là thấy thay đổi)
  function handleSaved() {
    setFormRoom(null)
    setReloadKey((key) => key + 1)
  }

  async function handleDelete(room: Room) {
    if (!window.confirm(`Xóa "${room.name}" cùng toàn bộ ${room._count.seats} ghế?`)) return

    setActionError(null)
    setDeletingId(room.id)
    try {
      await deleteRoom(room.id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const rows = rooms ?? []

  return (
    <div>
      {/* Đường dẫn quay lại danh sách rạp */}
      <p className="text-navy/60">
        <Link to="/admin/cinemas" className="text-title hover:underline">
          Rạp chiếu
        </Link>{' '}
        / {cinema?.name ?? '...'}
      </p>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Phòng chiếu{cinema && ` - ${cinema.name}`}</h1>
          {cinema && <p className="mt-2 text-lg text-navy/70">{cinema.address}</p>}
        </div>
        <button
          type="button"
          onClick={() => openForm('new')}
          className="rounded bg-title px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-navy"
        >
          + Thêm phòng
        </button>
      </div>

      {/* Chỉ báo lỗi (ví dụ xóa phòng đã có suất chiếu); thành công thì không hiện gì */}
      {actionError && <p className="mt-4 rounded bg-red-50 px-4 py-3 text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-x-auto rounded bg-white shadow-sm">
        {/* Chỉ hiện "Đang tải" lần đầu; khi tải lại vẫn giữ bảng cũ cho khỏi nháy */}
        {loading && !rooms && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {rooms && rows.length === 0 && <p className="p-6 text-lg text-navy/60">Rạp này chưa có phòng nào.</p>}

        {rows.length > 0 && (
          <table className="w-full min-w-[700px] text-left">
            <thead className="whitespace-nowrap bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Tên phòng</th>
                <th className="px-4 py-3 font-semibold">Số ghế</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((room, index) => {
                const isActive = room.status === 'active'
                return (
                  <tr key={room.id} className="border-t border-gray-200 hover:bg-cream">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{room.name}</td>
                    <td className="px-4 py-3">{room._count.seats} ghế</td>
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
                          to={`/admin/cinemas/${cinemaId}/rooms/${room.id}`}
                          className="rounded border border-navy px-4 py-1.5 text-navy transition hover:bg-navy hover:text-white"
                        >
                          Sơ đồ ghế
                        </Link>
                        <button
                          type="button"
                          onClick={() => openForm(room)}
                          className="rounded border border-title px-4 py-1.5 text-title transition hover:bg-title hover:text-white"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(room)}
                          disabled={deletingId === room.id}
                          className="rounded border border-red-500 px-4 py-1.5 text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                          {deletingId === room.id ? 'Đang xóa...' : 'Xóa'}
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

      {formRoom === 'new' && <CreateRoomModal cinemaId={cinemaId} onClose={() => setFormRoom(null)} onSaved={handleSaved} />}
      {formRoom !== null && formRoom !== 'new' && (
        <EditRoomModal room={formRoom} onClose={() => setFormRoom(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}

export default CinemaRoomsPage