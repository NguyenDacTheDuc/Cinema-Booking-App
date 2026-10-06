// Các hàm xử lý ngày giờ dùng chung cho những module làm việc với suất chiếu.
// Quy ước:
// - Cột DATE (showDate): Date lúc 00:00 UTC của ngày đó (ngày theo giờ Việt Nam)
// - Cột TIME (startTime, endTime): Date ngày 1970-01-01, phần giờ phút tính theo UTC

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

// Date đọc từ cột TIME -> số phút trong ngày (0 -> 1439)
export function timeDateToMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

// Date của cột DATE -> "YYYY-MM-DD"
export function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

// Date của cột TIME -> "HH:mm"
export function formatTime(value: Date): string {
  const minutes = timeDateToMinutes(value);
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Ghép ngày chiếu + giờ bắt đầu (giờ Việt Nam) thành một mốc thời gian thực,
// để so sánh trực tiếp với thời điểm hiện tại (Date.now()).
export function getShowtimeStartAt(showDate: Date, startTime: Date): Date {
  const startMinutes = timeDateToMinutes(startTime);
  return new Date(showDate.getTime() + startMinutes * 60 * 1000 - VIETNAM_OFFSET_MS);
}
