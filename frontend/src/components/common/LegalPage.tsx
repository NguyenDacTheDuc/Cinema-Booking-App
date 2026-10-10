import type { ReactNode } from 'react'

// Khung chung cho các trang văn bản (Chính sách bảo mật, Điều khoản sử dụng...):
// khối tiêu đề, mục lục bên trái, nội dung đánh số bên phải

export interface LegalSection {
  id: string // dùng để cuộn tới khi bấm mục lục
  title: string
  content: ReactNode
}

interface LegalPageProps {
  title: string
  subtitle: string
  lastUpdated: string
  intro: ReactNode // lời mở đầu, nằm trên các mục đánh số
  sections: LegalSection[]
}

// Màu link trong nội dung
export const legalLinkClass = 'font-semibold text-title hover:underline'

function CheckIcon() {
  return (
    <svg className="mt-1 size-5 shrink-0 text-sky" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Danh sách có dấu tích xanh
export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <CheckIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// Khung ghi chú nổi bật (lưu ý quan trọng)
export function NoteBox({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-5 py-4 text-amber-900">{children}</div>
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function LegalPage({ title, subtitle, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <div>
      {/* Khối tiêu đề, cùng kiểu với các trang Giới thiệu, Giá vé, Liên hệ */}
      <section className="bg-navy-pattern">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center text-white md:py-20">
          <p className="text-lg font-semibold uppercase tracking-[0.3em] text-sky">Cinema Booking</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{subtitle}</p>
          <p className="mt-4 text-sm text-white/60">Cập nhật lần cuối: {lastUpdated}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl items-start gap-8 px-4 py-12 lg:grid-cols-[280px_1fr]">
        {/* Mục lục: bấm để cuộn tới từng phần, luôn hiện khi cuộn ở màn hình lớn */}
        <nav aria-label="Mục lục" className="rounded-lg border-t-4 border-sky bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <p className="text-lg font-bold uppercase">Mục lục</p>
          <ol className="mt-3 space-y-1">
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className="flex w-full gap-2 rounded px-2 py-1.5 text-left text-navy/80 transition hover:bg-sky/10 hover:text-title"
                >
                  <span className="font-semibold text-title">{index + 1}.</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <article className="rounded-lg bg-white p-6 shadow-sm md:p-10">
          <div className="space-y-4 text-lg leading-relaxed text-navy/80">{intro}</div>

          {/* Các phần đánh số */}
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="mt-10 scroll-mt-6">
              <h2 className="flex items-center gap-3 border-b-2 border-sky pb-3 text-2xl font-bold md:text-3xl">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky text-lg text-white">
                  {index + 1}
                </span>
                {section.title}
              </h2>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-navy/80">{section.content}</div>
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}

export default LegalPage