import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { SearchIcon } from '../icons/Icons'
import Logo from './Logo'
import NavBar from './NavBar'

function Header() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('search') ?? '')

  // Tìm kiếm: chuyển về trang chủ kèm ?search=... để trang chủ hiển thị kết quả
  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = keyword.trim()
    navigate(value ? `/?search=${encodeURIComponent(value)}` : '/')
  }

  return (
    <header>
      <div className="bg-navy-pattern border-b-2 border-sky">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 px-4 py-6 md:flex-row md:gap-10 md:py-8">
          <Logo />

          <form onSubmit={handleSearch} className="flex w-full flex-1 items-center bg-navy-dark">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm phim..."
              className="w-full bg-transparent px-5 py-4 text-lg text-white placeholder:italic placeholder:text-white/80 focus:outline-none"
            />
            <button type="submit" className="px-5 text-white hover:text-sky" aria-label="Tìm kiếm">
              <SearchIcon className="size-7" />
            </button>
          </form>

          <div className="flex shrink-0 gap-4">
            <Link
              to="/login"
              className="border border-sky px-6 py-2.5 text-lg text-sky transition hover:bg-sky hover:text-white"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="border border-sky bg-sky px-8 py-2.5 text-lg text-white transition hover:bg-sky-dark"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
      <NavBar />
    </header>
  )   
}

export default Header
