import type { EntityStatus } from './genre';
import type { SeatType } from './seatType';

// ======================= Rạp =======================

export interface Cinema {
  id: number;
  name: string;
  address: string;
  status: EntityStatus;
}

export interface CinemaInput {
  name: string;
  address: string;
  status?: EntityStatus; // chỉ gửi khi sửa
}

// ======================= Phòng =======================

export interface Room {
  id: number;
  cinemaId: number;
  name: string;
  status: EntityStatus;
  _count: { seats: number }; // số ghế của phòng
}

// Tạo phòng: backend tự sinh ghế theo số hàng x số ghế mỗi hàng
export interface CreateRoomInput {
  cinemaId: number;
  name: string;
  rows: number;
  columns: number;
}

// Sửa phòng: chỉ đổi được tên và trạng thái
export interface UpdateRoomInput {
  name: string;
  status: EntityStatus;
}

// ======================= Ghế =======================

export interface Seat {
  id: number;
  roomId: number;
  seatTypeId: number;
  rowLabel: string; // A, B, C...
  columnNumber: number; // 1, 2, 3...
  seatType: SeatType;
}
