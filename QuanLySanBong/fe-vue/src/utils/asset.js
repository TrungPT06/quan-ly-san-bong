// Ghép đường dẫn tài nguyên trong thư mục public với base khi deploy (vd: /ten-repo/)
export const asset = (path) => `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, "")}`;
