// Lấy thông điệp lỗi dễ đọc từ lỗi trả về của http client
export function errorMessage(error, fallback) {
  return error.response?.data?.message || error.response?.data || error.message || fallback;
}
