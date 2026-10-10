const steps = ['Chọn ghế', 'Thanh toán', 'Nhận vé']

// Thanh tiến trình đặt vé: 1. Chọn ghế -> 2. Thanh toán -> 3. Nhận vé
function BookingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <ol className="mx-auto flex max-w-3xl items-center px-4 py-4">
        {steps.map((label, index) => {
          const step = index + 1
          const done = step < current
          const active = step === current
          return (
            <li key={label} className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
              {/* Đường nối với bước trước */}
              {index > 0 && <span className={`mx-2 h-0.5 flex-1 sm:mx-4 ${step <= current ? 'bg-sky' : 'bg-gray-200'}`} />}
              <span className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    done ? 'bg-sky text-white' : active ? 'bg-title text-white ring-4 ring-sky/30' : 'bg-gray-200 text-navy/50'
                  }`}
                >
                  {done ? (
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                      <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={`whitespace-nowrap text-sm sm:text-base ${active ? 'font-bold text-navy' : done ? 'text-navy' : 'text-navy/50'}`}
                >
                  {label}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default BookingSteps