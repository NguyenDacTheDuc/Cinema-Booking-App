import type { Genre } from './movie';

// Trạng thái dùng chung cho các bảng có bật/tắt: Genre, Cinema, Room
export type EntityStatus = 'active' | 'inactive';

// Thể loại admin nhìn thấy: có thêm trạng thái (GET /admin/genres)
export interface AdminGenre extends Genre {
  status: EntityStatus;
}

export interface CreateGenreInput {
  name: string;
}

export interface UpdateGenreInput {
  name?: string;
  status?: EntityStatus;
}
