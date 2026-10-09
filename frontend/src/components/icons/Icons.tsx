// Các icon SVG dùng chung. className dùng để chỉnh kích thước, màu (ví dụ "size-6 text-white")
interface IconProps {
  className?: string
}

export function SearchIcon({ className = 'size-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" strokeLinecap="round" />
    </svg>
  )
}

export function FilmIcon({ className = 'size-8' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="2.5" y="3.5" width="19" height="17" rx="1.5" />
      <path d="M7 3.5v17M17 3.5v17M2.5 8h4.5M2.5 12h19M2.5 16h4.5M17 8h4.5M17 16h4.5" />
    </svg>
  )
}
