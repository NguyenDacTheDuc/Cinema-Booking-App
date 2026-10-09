export type UserRole = 'admin' | 'customer';
export type UserStatus = 'active' | 'inactive';

// Thông tin người dùng backend trả về (không bao giờ có mật khẩu)
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  gender: string | null;
  dateOfBirth: string; // dạng ISO, ví dụ "2004-11-22T00:00:00.000Z"
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  dateOfBirth: string; // dạng "YYYY-MM-DD"
}

// Đăng nhập, đăng ký thành công đều trả về token kèm thông tin người dùng
export interface AuthResult {
  token: string;
  user: User;
}
