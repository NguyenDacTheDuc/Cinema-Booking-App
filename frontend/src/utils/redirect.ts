import type { UserRole } from '../types/auth';

// Trang cần chuyển tới sau khi đăng nhập:
// - Admin: vào trang quản lý khách hàng (hoặc đúng trang quản trị đang định mở trước đó)
// - Khách hàng: quay lại trang đang xem trước đó, không có thì về trang chủ
export function getHomePath(role: UserRole, from?: string): string {
  const isAdminPath = from?.startsWith('/admin') ?? false;
  if (role === 'admin') return isAdminPath && from ? from : '/admin/dashboard';
  return !isAdminPath && from ? from : '/';
}
