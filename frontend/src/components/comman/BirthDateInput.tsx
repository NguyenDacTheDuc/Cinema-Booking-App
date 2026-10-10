import { Fragment, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { MAX_BIRTH_DATE, MIN_BIRTH_DATE, toDisplayDate, toIsoDate } from '../../utils/birthDate'

interface BirthDateInputProps {
  value: string // "dd/mm/yyyy", có thể đang nhập dở, ví dụ "22/1/"
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: (el: HTMLInputElement | null) => void
}

// Ô ngày sinh chia 3 phần dd / mm / yyyy giống ô ngày của trình duyệt:
// bấm vào phần nào thì nhập số phần đó, nhập đủ số thì tự nhảy sang phần sau.
// Icon lịch bên phải: bấm mới hiện lịch.
function BirthDateInput({ value, onChange, onBlur, inputRef }: BirthDateInputProps) {
  const [focused, setFocused] = useState(false)
  const dayRef = useRef<HTMLInputElement | null>(null)
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)
  // Ô chọn ngày có sẵn của trình duyệt, ẩn đi, chỉ dùng để bật lịch khi bấm icon
  const pickerRef = useRef<HTMLInputElement>(null)

  const [day = '', month = '', year = ''] = value.split('/')
  const parts = [day, month, year]

  // firstDigitMax: gõ 1 số lớn hơn số này thì tự thêm số 0 phía trước (gõ "5" ở ngày -> "05")
  const segments = [
    { ref: dayRef, placeholder: 'dd', length: 2, firstDigitMax: 3, width: 'w-[2.6ch]' },
    { ref: monthRef, placeholder: 'mm', length: 2, firstDigitMax: 1, width: 'w-[2.8ch]' },
    { ref: yearRef, placeholder: 'yyyy', length: 4, firstDigitMax: 9, width: 'w-[4.6ch]' },
  ]

  function handleChange(index: number, raw: string) {
    const segment = segments[index]
    let digits = raw.replace(/\D/g, '').slice(0, segment.length)
    if (digits.length === 1 && Number(digits) > segment.firstDigitMax) digits = `0${digits}`

    const next = [...parts]
    next[index] = digits
    onChange(next.some(Boolean) ? next.join('/') : '')

    // Nhập đủ số thì nhảy sang phần tiếp theo
    if (digits.length === segment.length) segments[index + 1]?.ref.current?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    // Xóa hết một phần mà bấm Backspace tiếp thì lùi về phần trước
    if (e.key === 'Backspace' && parts[index] === '' && index > 0) {
      e.preventDefault()
      segments[index - 1].ref.current?.focus()
      return
    }
    // Bấm "/" thì nhảy sang phần sau; các phím chữ khác thì bỏ qua, chỉ cho nhập số
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (e.key === '/' && parts[index] !== '') segments[index + 1]?.ref.current?.focus()
    }
  }

  function openDatePicker() {
    const picker = pickerRef.current
    if (!picker) return
    picker.value = toIsoDate(value) ?? ''
    try {
      picker.showPicker()
    } catch {
      // Trình duyệt quá cũ không hỗ trợ thì vẫn nhập số được
    }
  }

  // Chưa bấm vào và chưa nhập gì thì chỉ hiện chữ "Ngày sinh"
  const showLabel = !focused && value === ''

  return (
    <div
      className="relative"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        // Chỉ tính là rời ô khi con trỏ ra hẳn ngoài cả cụm dd/mm/yyyy và icon
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocused(false)
          onBlur()
        }
      }}
    >
      <div
        // Bấm vào chỗ trống trong ô thì bắt đầu nhập từ phần ngày
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault()
            dayRef.current?.focus()
          }
        }}
        className="flex w-full cursor-text items-center rounded border border-gray-300 bg-white px-4 py-2.5 pr-12 text-lg focus-within:border-sky focus-within:ring-2 focus-within:ring-sky/40"
      >
        {showLabel && <span className="pointer-events-none absolute left-[17px] text-gray-400">Ngày sinh</span>}

        <div className={`flex items-center ${showLabel ? 'pointer-events-none opacity-0' : ''}`}>
          {segments.map((segment, index) => (
            <Fragment key={segment.placeholder}>
              {index > 0 && <span className="px-0.5">/</span>}
              <input
                ref={
                  index === 0
                    ? (el) => {
                        dayRef.current = el
                        inputRef(el)
                      }
                    : segment.ref
                }
                type="text"
                inputMode="numeric"
                placeholder={segment.placeholder}
                value={parts[index]}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                // Vào phần nào thì bôi đen cả phần đó, gõ số mới sẽ thay số cũ
                onFocus={(e) => e.target.select()}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.currentTarget.focus()
                  e.currentTarget.select()
                }}
                className={`${segment.width} h-7 rounded-sm bg-transparent p-0 text-center placeholder:text-gray-400 focus:bg-sky/25 focus:outline-none`}
              />
            </Fragment>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={openDatePicker}
        className="absolute inset-y-0 right-0 px-3 text-navy/70 hover:text-navy"
        aria-label="Chọn ngày sinh trên lịch"
      >
        <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      </button>

      {/* Ô chọn ngày ẩn, đặt sát mép phải với độ rộng gần bằng lịch
          để lịch bật ra ngay dưới ô, mép phải thẳng hàng mép phải ô nhập */}
      <input
        ref={pickerRef}
        type="date"
        min={MIN_BIRTH_DATE}
        max={MAX_BIRTH_DATE}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.value) onChange(toDisplayDate(e.target.value))
        }}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-64 border-0 p-0 opacity-0"
      />
    </div>
  )
}

export default BirthDateInput