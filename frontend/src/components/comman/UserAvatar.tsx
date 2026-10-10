import { useState } from 'react'

interface UserAvatarProps {
  fullName: string
  avatar: string | null
  className?: string // kích thước, cỡ chữ, ví dụ "size-10 text-lg"
}

// Ảnh đại diện tròn. Chưa có ảnh (hoặc link ảnh hỏng) thì hiện chữ cái đầu của tên gọi:
// "Nguyễn Đắc Thiên Trường" -> "T"
function UserAvatar({ fullName, avatar, className = 'size-10 text-lg' }: UserAvatarProps) {
  // Lưu lại link ảnh bị lỗi, để khi đổi sang link khác thì thử hiện lại
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null)
  const givenName = fullName.trim().split(/\s+/).pop() ?? ''
  const initial = givenName.charAt(0).toUpperCase() || '?'

  if (avatar && avatar !== brokenSrc) {
    return (
      <img
        src={avatar}
        alt={fullName}
        onError={() => setBrokenSrc(avatar)}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-sky font-bold text-white`}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}

export default UserAvatar