import { Link } from 'react-router'
import { FilmIcon } from '../icons/Icons'

// Logo dạng chữ. Có ảnh logo riêng thì thay bằng thẻ <img> trỏ tới file trong src/assets
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <FilmIcon className="size-12 text-sky" />
      <span className="leading-none">
        <span className="block text-3xl font-bold tracking-wide text-sky">CINEMA</span>
        <span className="block text-sm font-semibold tracking-[0.35em] text-amber-300">BOOKING</span>
      </span>
    </Link>
  )
}

export default Logo
