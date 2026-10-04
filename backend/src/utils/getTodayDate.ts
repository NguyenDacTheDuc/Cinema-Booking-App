// Ngày hôm nay theo giờ Việt Nam (UTC+7), đưa về 00:00 UTC
// để so sánh đúng với các cột kiểu DATE (không có giờ) như
// Movie.releaseDate, Showtime.showDate.
// Nếu dùng thẳng new Date() thì từ 0h đến 7h sáng giờ Việt Nam
// server vẫn tính là ngày hôm trước (vì giờ UTC chậm hơn 7 tiếng).
export function getTodayDate(): Date {
  const vietnamNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), vietnamNow.getUTCDate()));
}
