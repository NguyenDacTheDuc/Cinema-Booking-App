import { createContext } from 'react';
import type { LoginInput, User } from '../types/auth';

export interface AuthContextValue {
  user: User | null; // null: chưa đăng nhập
  loading: boolean; // true trong lúc đang kiểm tra token đã lưu khi mới mở web
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
