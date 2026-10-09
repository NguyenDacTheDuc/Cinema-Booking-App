// Định dạng chung mọi response thành công của backend (hàm sendSuccess)
export interface ApiResponse<T> {
  success: boolean
  data: T
}
