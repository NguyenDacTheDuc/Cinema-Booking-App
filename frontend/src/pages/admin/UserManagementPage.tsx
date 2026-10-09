import { useState } from 'react'
import { getErrorMessage } from '../../api/axiosClient'
import { getUsers, updateUserStatus } from '../../api/userApi'
import { useFetch } from '../../hooks/useFetch'
import type { User } from '../../types/auth'
import { formatDate } from '../../utils/format'

// Admin: danh sách khách hàng, khóa hoặc mở khóa tài khoản
function UserManagementPage() {
  const { data: users, loading, error } = useFetch(() => getUsers(), [])
  // Lưu các tài khoản vừa đổi trạng thái, để cập nhật bảng ngay mà không phải tải lại
  const [changed, setChanged] = useState<Record<number, User>>({})
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleToggleStatus(user: User) {
    const isLocking = user.status === 'active'
    const confirmText = isLocking
      ? `Khóa tài khoản ${user.email}? Khách hàng sẽ bị đăng xuất và không đăng nhập được nữa.`
      : `Mở khóa tài khoản ${user.email}?`
    if (!window.confirm(confirmText)) return

    setActionError(null)
    setUpdatingId(user.id)
    try {
      const updated = await updateUserStatus(user.id, isLocking ? 'inactive' : 'active')
      setChanged((prev) => ({ ...prev, [updated.id]: updated }))
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  const rows = (users ?? []).map((u) => changed[u.id] ?? u)

  return (
    <div>
      <h1 className="text-3xl font-bold">Quản lý khách hàng</h1>
      <p className="mt-2 text-lg text-navy/70">Danh sách tài khoản khách hàng, khóa hoặc mở khóa khi cần.</p>

      {actionError && <p className="mt-4 text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-x-auto rounded bg-white shadow-sm">
        {loading && <p className="p-6 text-lg text-navy/60">Đang tải...</p>}
        {!loading && error && <p className="p-6 text-lg text-red-600">{error}</p>}
        {!loading && !error && rows.length === 0 && <p className="p-6 text-lg text-navy/60">Chưa có khách hàng nào.</p>}

        {!loading && !error && rows.length > 0 && (
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">STT</th>
                <th className="px-4 py-3 font-semibold">Họ tên</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                <th className="px-4 py-3 font-semibold">Ngày sinh</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user, index) => {
                const isActive = user.status === 'active'
                return (
                  <tr key={user.id} className="border-t border-gray-200 hover:bg-cream">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{user.fullName}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.phone}</td>
                    <td className="px-4 py-3">{formatDate(user.dateOfBirth)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        disabled={updatingId === user.id}
                        className={`rounded border px-4 py-1.5 transition disabled:opacity-50 ${
                          isActive
                            ? 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
                            : 'border-green-600 text-green-700 hover:bg-green-600 hover:text-white'
                        }`}
                      >
                        {updatingId === user.id ? 'Đang lưu...' : isActive ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default UserManagementPage