// Các hàm xử lý ngày sinh dùng chung cho trang Đăng ký và Hồ sơ cá nhân

// Lấy ngày hôm nay (hoặc lùi lại vài năm) dạng "YYYY-MM-DD"
function getDateString(yearsAgo = 0) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - yearsAgo);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Ngày sinh chỉ được chọn trong khoảng 100 năm trước tới hôm nay
export const MIN_BIRTH_DATE = getDateString(100);
export const MAX_BIRTH_DATE = getDateString();

// "22/11/2004" -> "2004-11-22". Sai định dạng hoặc ngày không có thật (31/02...) -> null
export function toIsoDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isRealDate = date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day);
  return isRealDate ? `${year}-${month}-${day}` : null;
}

// "2004-11-22" -> "22/11/2004" để hiển thị
export function toDisplayDate(iso: string) {
  return iso.split('-').reverse().join('/');
}

// Kiểm tra ô ngày sinh dạng dd/mm/yyyy: ngày có thật và nằm trong khoảng cho phép
export function isValidBirthDate(value: string) {
  const iso = toIsoDate(value);
  return iso !== null && iso >= MIN_BIRTH_DATE && iso <= MAX_BIRTH_DATE;
}
