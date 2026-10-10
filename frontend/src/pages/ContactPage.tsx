import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { getActiveCinemas } from '../api/cinemaApi'
import { FilmIcon } from '../components/icons/Icons'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import type { User } from '../types/auth'

// Thông tin liên hệ: giống phần chân trang
const contactInfo = {
  name: 'Hệ thống rạp chiếu phim Cinema Booking',
  address: 'Hà Nội, Việt Nam',
  phone: '0123.456.789',
  email: 'contact@cinemabooking.vn',
  hours: '8:00 - 23:00, tất cả các ngày trong tuần',
}

const topics = ['Hỗ trợ đặt vé', 'Góp ý dịch vụ', 'Hợp tác quảng cáo', 'Khác']

const faqs = [
  {
    question: 'Tôi có thể giữ ghế trong bao lâu?',
    answer: 'Ghế bạn chọn được giữ trong 5 phút. Hết thời gian mà chưa thanh toán, ghế sẽ tự động được nhả ra cho người khác.',
  },
  {
    question: 'Mỗi lần đặt được bao nhiêu vé?',
    answer: 'Mỗi lần đặt bạn được chọn tối đa 8 ghế trong cùng một suất chiếu.',
  },
  {
    question: 'Đặt vé xong tôi nhận vé ở đâu?',
    answer:
      'Vé điện tử có mã QR và mã đặt vé nằm trong mục Vé của tôi. Bạn chỉ cần đưa mã cho nhân viên tại quầy để vào phòng chiếu.',
  },
  {
    question: 'Tôi có thể đổi hoặc hủy vé đã thanh toán không?',
    answer: 'Vé đã thanh toán không hỗ trợ đổi hoặc hoàn tiền. Vui lòng kiểm tra kỹ suất chiếu và ghế trước khi thanh toán.',
  },
]

const contactSchema = z.object({
  fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên'),
  email: z.string().trim().min(1, 'Vui lòng nhập email').pipe(z.email('Email không hợp lệ')),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || /^0\d{9}$/.test(value), 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0'),
  topic: z.string().min(1, 'Vui lòng chọn chủ đề'),
  message: z.string().trim().min(10, 'Nội dung cần ít nhất 10 ký tự').max(1000, 'Nội dung tối đa 1000 ký tự'),
})

type ContactForm = z.infer<typeof contactSchema>

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-4 py-2.5 text-lg focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40'
const labelClass = 'mb-1 block font-semibold'

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// Tiêu đề khối, cùng kiểu với trang Giới thiệu và Giá vé
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="border-b-2 border-sky">
      <h2 className="-mb-0.5 inline-flex items-center gap-2 border-b-[3px] border-navy pb-3 text-3xl font-bold uppercase md:text-4xl">
        <FilmIcon className="size-10" />
        {children}
      </h2>
    </div>
  )
}

// Một dòng thông tin liên hệ có biểu tượng tròn bên trái
function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sky/15 text-title">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-navy/60">{label}</p>
        <div className="text-lg font-semibold">{children}</div>
      </div>
    </li>
  )
}

const iconProps = {
  className: 'size-5',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

// Form liên hệ: đăng nhập rồi thì điền sẵn tên, email, số điện thoại
function ContactFormCard({ user }: { user: User | null }) {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      topic: '',
      message: '',
    },
  })

  // Chưa có API liên hệ: giả lập gửi thành công
  async function onSubmit() {
    await wait(800)
    setSent(true)
  }

  function handleSendAnother() {
    reset({ fullName: user?.fullName ?? '', email: user?.email ?? '', phone: user?.phone ?? '', topic: '', message: '' })
    setSent(false)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-lg border-t-4 border-sky bg-white px-6 py-14 text-center shadow-sm">
        <span className="flex size-16 items-center justify-center rounded-full bg-green-500 text-white">
          <svg className="size-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-5 text-2xl font-bold">Cảm ơn bạn đã liên hệ</p>
        <p className="mt-2 max-w-md text-navy/70">
          Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi qua email sớm nhất có thể.
        </p>
        <button
          type="button"
          onClick={handleSendAnother}
          className="mt-6 rounded border border-title px-6 py-2.5 font-semibold text-title transition hover:bg-title hover:text-white"
        >
          Gửi tin nhắn khác
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-lg border-t-4 border-sky bg-white p-6 shadow-sm md:p-8"
    >
      <h3 className="text-2xl font-bold">Gửi tin nhắn cho chúng tôi</h3>
      <p className="mt-1 text-navy/70">Điền thông tin bên dưới, chúng tôi sẽ phản hồi qua email của bạn.</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            Họ và tên <span className="text-red-600">*</span>
          </label>
          <input id="contact-name" type="text" autoComplete="name" {...register('fullName')} className={inputClass} />
          {errors.fullName && <p className="mt-1 text-red-600">{errors.fullName.message}</p>}
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClass}>
            Email <span className="text-red-600">*</span>
          </label>
          <input id="contact-email" type="email" autoComplete="email" {...register('email')} className={inputClass} />
          {errors.email && <p className="mt-1 text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="contact-phone" className={labelClass}>
            Số điện thoại
          </label>
          <input id="contact-phone" type="tel" autoComplete="tel" {...register('phone')} className={inputClass} />
          {errors.phone && <p className="mt-1 text-red-600">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="contact-topic" className={labelClass}>
            Chủ đề <span className="text-red-600">*</span>
          </label>
          <select id="contact-topic" {...register('topic')} className={inputClass}>
            <option value="">-- Chọn chủ đề --</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          {errors.topic && <p className="mt-1 text-red-600">{errors.topic.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="contact-message" className={labelClass}>
            Nội dung <span className="text-red-600">*</span>
          </label>
          <textarea id="contact-message" rows={6} {...register('message')} className={`${inputClass} resize-y`} />
          {errors.message && <p className="mt-1 text-red-600">{errors.message.message}</p>}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-title px-8 py-3 text-lg font-semibold text-white transition hover:bg-navy disabled:opacity-50 disabled:hover:bg-title"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi liên hệ'}
        </button>
      </div>
    </form>
  )
}

function ContactPage() {
  const { user, loading } = useAuth()
  const { data: cinemas } = useFetch(() => getActiveCinemas(), [])

  return (
    <div>
      {/* Khối tiêu đề, cùng kiểu với trang Giới thiệu, Lịch chiếu và Giá vé */}
      <section className="bg-navy-pattern">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center text-white md:py-20">
          <p className="text-lg font-semibold uppercase tracking-[0.3em] text-sky">Cinema Booking</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Liên hệ</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Chúng tôi luôn sẵn sàng lắng nghe góp ý và hỗ trợ bạn trong quá trình đặt vé.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4">
        <section className="py-12">
          <SectionTitle>Thông tin liên hệ</SectionTitle>

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-5">
            {/* Thông tin liên hệ và hệ thống rạp */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <p className="text-xl font-bold uppercase text-title">{contactInfo.name}</p>
                <ul className="mt-5 space-y-5">
                  <InfoRow
                    label="Địa chỉ"
                    icon={
                      <svg {...iconProps}>
                        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
                        <circle cx="12" cy="9.5" r="2.5" />
                      </svg>
                    }
                  >
                    {contactInfo.address}
                  </InfoRow>
                  <InfoRow
                    label="Hotline"
                    icon={
                      <svg {...iconProps}>
                        <path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />
                      </svg>
                    }
                  >
                    <a href={`tel:${contactInfo.phone.replaceAll('.', '')}`} className="text-title hover:underline">
                      {contactInfo.phone}
                    </a>
                  </InfoRow>
                  <InfoRow
                    label="Email"
                    icon={
                      <svg {...iconProps}>
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    }
                  >
                    <a href={`mailto:${contactInfo.email}`} className="break-all text-title hover:underline">
                      {contactInfo.email}
                    </a>
                  </InfoRow>
                  <InfoRow
                    label="Giờ làm việc"
                    icon={
                      <svg {...iconProps}>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                    }
                  >
                    {contactInfo.hours}
                  </InfoRow>
                </ul>
              </div>

              {/* Các rạp đang hoạt động, lấy từ hệ thống */}
              {cinemas && cinemas.length > 0 && (
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <p className="text-xl font-bold">Hệ thống rạp</p>
                  <ul className="mt-4 divide-y divide-gray-100">
                    {cinemas.map((cinema) => (
                      <li key={cinema.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-semibold">{cinema.name}</p>
                        <p className="text-sm text-navy/60">{cinema.address}</p>
                      </li>
                    ))}
                  </ul>
                  <Link to="/showtimes" className="mt-4 inline-block font-semibold text-title hover:underline">
                    Xem lịch chiếu các rạp →
                  </Link>
                </div>
              )}
            </div>

            {/* Form liên hệ: chờ biết đã đăng nhập hay chưa để điền sẵn thông tin */}
            <div className="lg:col-span-3">
              {!loading && <ContactFormCard key={user?.id ?? 'guest'} user={user} />}
            </div>
          </div>
        </section>

        {/* Câu hỏi thường gặp */}
        <section className="pb-12">
          <SectionTitle>Câu hỏi thường gặp</SectionTitle>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-lg bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="text-2xl leading-none text-title transition group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="border-t border-gray-100 px-6 py-4 text-navy/80">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ContactPage