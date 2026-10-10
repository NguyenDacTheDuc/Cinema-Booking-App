// Tên phim -> đường dẫn không dấu: "Quỷ Ăn Tạng 4: Hổ Tinh" -> "quy-an-tang-4-ho-tinh"
export function toSlug(text: string): string {
  return text
    .normalize('NFD') // tách chữ và dấu: "ỷ" -> "y" + dấu
    .replace(/[\u0300-\u036f]/g, '') // bỏ các dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // ký tự khác chữ, số -> "-"
    .replace(/^-+|-+$/g, ''); // bỏ "-" thừa ở đầu, cuối
}

// Đường dẫn trang chi tiết phim
export function getMoviePath(title: string): string {
  return `/movie/${toSlug(title)}`;
}

// Đường dẫn trang chọn suất chiếu của 1 phim (bấm "Mua vé")
export function getShowtimePath(title: string): string {
  return `/showtime/${toSlug(title)}`;
}
