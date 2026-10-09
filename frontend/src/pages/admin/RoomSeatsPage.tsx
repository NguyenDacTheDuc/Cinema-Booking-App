import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getErrorMessage } from '../../api/axiosClient'
import { getAllCinemas } from '../../api/cinemaApi'
import { changeSeatType, getRoomsByCinema, getSeatsByRoom } from '../../api/roomApi'
import { getSeatTypes } from '../../api/seatTypeApi'
import { useFetch } from '../../hooks/useFetch'
import type { Seat } from '../../types/cinema'

// Màu cho từng loại ghế, theo thứ tự trong danh sách loại ghế (loại mặc định "thường" đứng đầu)
const SEAT_COLORS = [
  'bg-gray-200 text-navy',
  'bg-amber-400 text-white',
  'bg-rose-500 text-white',
  'bg-violet-500 text-white',
  'bg-emerald-500 text-white',
  'bg-sky-600 text-white',
]

// 75000 hoặc "75000.00" -> "75.000 ₫"
function formatMoney(value: number | string) {
  return `${Number(value).toLocaleString('vi-VN')} ₫`
}

// Admin: xem sơ đồ ghế của 1 phòng và đổi loại ghế.
// Chọn loại ghế ở trên, rồi bấm vào từng ghế (hoặc chữ cái đầu hàng để đổi cả hàng).
function RoomSeatsPage() {
  const params = useParams()
  const cinemaId = Number(params.cinemaId)
  const roomId = Number(params.roomId)

  // Tên rạp, tên phòng để hiện tiêu đề (tìm trong danh sách vì backend không có API xem 1 phòng)
  const { data: cinemas } = useFetch(() => getAllCinemas(), [])
  const { data: rooms } = useFetch(() => getRoomsByCinema(cinemaId), [cinemaId])
  const cinema = cinemas?.find((item) => item.id === cinemaId)
  const room = rooms?.find((item) => item.id === roomId)

  const { data: seatTypes } = useFetch(() => getSeatTypes(), [])
  const { data: seats, loading, error } = useFetch(() => getSeatsByRoom(roomId), [roomId])

  // Loại ghế đang chọn để "tô" lên ghế; chưa chọn thì dùng loại đầu tiên
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const activeTypeId = selectedTypeId ?? seatTypes?.[0]?.id ?? null

  // Ghế vừa đổi loại: lưu lại để cập nhật sơ đồ ngay, không phải tải lại cả phòng
  const [changed, setChanged] = useState<Record<number, Seat>>({})
  const [savingIds, setSavingIds] = useState<number[]>([])
  const [actionError, setActionError] = useState<string | null>(null)

  const allSeats = (seats ?? []).map((seat) => changed[seat.id] ?? seat)

  // Gom ghế theo hàng: { A: [...], B: [...] } (backend đã sắp theo hàng rồi theo số ghế)
  const seatRows: { label: string; seats: Seat[] }[] = []
  for (const seat of allSeats) {
    const lastRow = seatRows[seatRows.length - 1]
    if (lastRow && lastRow.label === seat.rowLabel) lastRow.seats.push(seat)
    else seatRows.push({ label: seat.rowLabel, seats: [seat] })
  }

  function getColor(seatTypeId: number) {
    const index = (seatTypes ?? []).findIndex((type) => type.id === seatTypeId)
    return SEAT_COLORS[Math.max(index, 0) % SEAT_COLORS.length]
  }

  // Đổi loại cho 1 hoặc nhiều ghế (bỏ qua ghế đã đúng loại)
  async function applySeatType(targets: Seat[]) {
    if (activeTypeId === null) return
    const toChange = targets.filter((seat) => seat.seatTypeId !== activeTypeId && !savingIds.includes(seat.id))
    if (toChange.length === 0) return

    setActionError(null)
    const ids = toChange.map((seat) => seat.id)
    setSavingIds((prev) => [...prev, ...ids])
    try {
      const updated = await Promise.all(toChange.map((seat) => changeSeatType(seat.id, activeTypeId)))
      setChanged((prev) => {
        const next = { ...prev }
        for (const seat of updated) next[seat.id] = seat
        return next
      })
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setSavingIds((prev) => prev.filter((id) => !ids.includes(id)))
    }
  }

  return (
    <div>
      {/* Đường dẫn quay lại */}
      <p className="text-navy/60">
        <Link to="/admin/cinemas" className="text-title hover:underline">
          Rạp chiếu
        </Link>{' '}
        /{' '}
        <Link to={`/admin/cinemas/${cinemaId}`} className="text-title hover:underline">
          {cinema?.name ?? '...'}
        </Link>{' '}
        / {room?.name ?? '...'}
      </p>

      <h1 className="mt-2 text-3xl font-bold">Sơ đồ ghế{room && ` - ${room.name}`}</h1>
      <p className="mt-2 text-lg text-navy/70">
        Chọn loại ghế bên dưới, rồi bấm vào ghế để đổi. Bấm vào chữ cái đầu hàng để đổi cả hàng.
      </p>

      {/* Chọn loại ghế để tô, kèm số ghế hiện có của mỗi loại */}
      <div className="mt-6 flex flex-wrap gap-3">
        {(seatTypes ?? []).map((type) => {
          const isActive = type.id === activeTypeId
          const count = allSeats.filter((seat) => seat.seatTypeId === type.id).length
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedTypeId(type.id)}
              className={`flex items-center gap-3 rounded border-2 bg-white px-4 py-2 text-left transition ${
                isActive ? 'border-title shadow' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <span className={`size-6 rounded ${getColor(type.id)}`} />
              <span>
                <span className="block font-semibold">{type.name}</span>
                <span className="block text-sm text-navy/60">
                  {formatMoney(type.price)} · {count} ghế
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {actionError && <p className="mt-4 rounded bg-red-50 px-4 py-3 text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-x-auto rounded bg-white p-6 shadow-sm">
        {loading && <p className="text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="text-lg text-red-600">{error}</p>}
        {!loading && !error && seatRows.length === 0 && <p className="text-lg text-navy/60">Phòng này chưa có ghế.</p>}

        {seatRows.length > 0 && (
          <div className="mx-auto w-max">
            {/* Màn hình chiếu */}
            <div className="mx-auto mb-8 w-3/4">
              <div className="h-2 rounded-full bg-linear-to-r from-sky/30 via-sky to-sky/30" />
              <p className="mt-1 text-center text-sm tracking-[0.3em] text-navy/50">MÀN HÌNH</p>
            </div>

            <div className="space-y-2">
              {seatRows.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applySeatType(row.seats)}
                    title={`Đổi cả hàng ${row.label}`}
                    className="w-8 shrink-0 rounded py-1 text-center font-semibold text-navy/60 hover:bg-cream hover:text-navy"
                  >
                    {row.label}
                  </button>
                  {row.seats.map((seat) => (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => applySeatType([seat])}
                      disabled={savingIds.includes(seat.id)}
                      title={`Ghế ${seat.rowLabel}${seat.columnNumber} - ${seat.seatType.name}`}
                      className={`size-9 shrink-0 rounded-t-lg text-xs font-semibold transition hover:ring-2 hover:ring-title disabled:animate-pulse ${getColor(
                        seat.seatTypeId,
                      )}`}
                    >
                      {seat.columnNumber}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoomSeatsPage