import { LockIcon, TicketIcon, UserIcon } from '../icons/Icons';

// Các mục tài khoản, dùng chung cho menu thả xuống ở header và menu trái của trang Tài khoản
export const accountMenu = [
  { label: 'Vé của tôi', to: '/account/tickets', Icon: TicketIcon },
  { label: 'Hồ sơ cá nhân', to: '/account/profile', Icon: UserIcon },
  { label: 'Đổi mật khẩu', to: '/account/password', Icon: LockIcon },
];
