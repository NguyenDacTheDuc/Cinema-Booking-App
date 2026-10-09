// Loại ghế (GET /seat-types)
export interface SeatType {
  id: number;
  name: string;
  price: string; // backend lưu kiểu Decimal nên trả về dạng chuỗi, ví dụ "75000"
}

export interface SeatTypeInput {
  name: string;
  price: number;
}
