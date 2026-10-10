// "2026-09-25T00:00:00.000Z" -> "25-09-2026"
// Đọc theo UTC vì cột DATE của backend được lưu lúc 00:00 UTC
export function formatDate(value: string | null): string {
  if (!value) return 'Đang cập nhật';
  const date = new Date(value);
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${date.getUTCFullYear()}`;
}

// 190000 hoặc "190000.00" -> "190.000 ₫"
export function formatMoney(value: number | string | null): string {
  return `${Number(value ?? 0).toLocaleString('vi-VN')} ₫`;
}
