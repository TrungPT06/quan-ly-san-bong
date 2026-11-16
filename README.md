SÂN BÓNG PRO — Hệ thống Quản lý & Đặt Sân Bóng Trực Tuyến

Ứng dụng web (SPA) hỗ trợ khách hàng tìm kiếm, đặt sân bóng theo khung giờ, thanh toán trực tuyến qua VNPay và tích hợp trợ lý AI tư vấn sân; đồng thời cung cấp phân hệ vận hành cho nhân viên trực Page, nhân viên tại sân (POS) và quản trị viên.

Repository: TrungPT06/quan-ly-san-bong

Live Demo (GitHub Pages): trungpt06.github.io/quan-ly-san-bong

Vai trò cá nhân (My Contributions)

Chuyển đổi Frontend (React $\rightarrow$ Vue 3): Tiếp nhận mã nguồn Frontend React từ nhóm, sử dụng công cụ AI hỗ trợ chuyển đổi sang Vue 3 (Composition API, Pinia, Vue Router) và rà soát lại cấu trúc component, luồng điều hướng giữa các màn hình.

Kiểm thử chức năng Đặt sân & Thanh toán (Manual QA): Kiểm tra toàn bộ luồng chọn sân, chọn ngày thi đấu, 4 trạng thái khung giờ (TRONG, DA_DAT, KHONG_HOAT_DONG, đang chọn), thanh toán Tiền mặt / cổng VNPay, xuất hóa đơn điện tử và xử lý xung đột đặt trùng (HTTP 409 Conflict) để đảm bảo bản Vue 3 hoạt động đúng như thiết kế ban đầu.

Tính năng chính

Phân hệ

Chức năng nổi bật

Khách hàng

Đăng ký/đăng nhập JWT (đồng bộ đa tab), tìm kiếm sân tiếng Việt không dấu, lọc theo cụm sân/loại sân, lưu sân yêu thích, đặt sân theo khung giờ, thanh toán VNPay/Tiền mặt, xem lịch sử & hóa đơn điện tử.

Trợ lý AI Chatbot

Tư vấn chọn sân dựa trên danh sách sân và bảng giá thực tế từ Pinia Store, hỗ trợ hủy request (AbortController) và hiển thị nút chuyển hướng nhanh tới trang chi tiết sân.

Nhân viên Page & Tại sân

Xem ma trận lịch sân theo ngày (StaffScheduleMatrix), duyệt/từ chối đơn đặt online, check-in POS theo mã đơn/SĐT và tạo đơn đặt trực tiếp tại quầy (Walk-in Booking).

Quản trị viên (Admin)

Dashboard thống kê kèm biểu đồ SVG doanh thu và tỷ lệ loại sân, quản lý CRUD cụm sân/sân bóng (tải ảnh lên MinIO), cấu hình khung giờ & bảng giá theo loại ngày, đối soát thanh toán và báo cáo doanh thu.

Công nghệ sử dụng (Tech Stack)

Frontend: Vue 3 (Composition API), Pinia, Vue Router 4, Vite

Backend: Java Spring Boot, Spring Security (JWT)

Cơ sở dữ liệu & Lưu trữ: PostgreSQL, MinIO (Object Storage)

Thanh toán & AI: VNPay Payment Gateway, Google Gemini API (gemini-2.5-flash) / OpenAI API (gpt-4o-mini)

Kiểm thử & DevOps: node:test, Vitest, GitHub Actions CI/CD, Docker, Nginx

Ảnh chụp màn hình (Screenshots)

Chụp 3–4 ảnh giao diện thực tế từ dự án (đặc biệt là màn hình Đặt sân & Thanh toán), lưu vào thư mục docs/screenshots/ trong repo và điền lại link ảnh vào bảng dưới đây.

Trang chủ & Tìm kiếm sân

Chi tiết sân & Chọn khung giờ





Kết quả thanh toán VNPay / Hóa đơn

Ma trận lịch sân & Admin Dashboard





Cài đặt và chạy dự án

1. Chạy Frontend (fe-vue)

cd QuanLySanBong/fe-vue
npm install
npm run dev


Tạo tệp .env (hoặc .env.local) trong thư mục QuanLySanBong/fe-vue với các biến môi trường cần thiết:

VITE_API_BASE_URL=http://localhost:8080
VITE_MINIO_PUBLIC_URL=http://localhost:9000
VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=<your-gemini-api-key>


2. Chạy kiểm thử (Testing)

# Chạy kiểm thử Frontend (26 test cases: node:test & Vitest)
cd QuanLySanBong/fe-vue
npm test


Kiểm thử & CI/CD

Frontend: 26 bài kiểm thử đơn vị và smoke test (tests/client.test.cjs, tests/stores.test.cjs, tests/ui/app.smoke.test.js).

Backend: 47 bài kiểm thử tự động.

GitHub Actions: Pipeline tại .github/workflows/ci-cd.yml tự động chạy lint $\rightarrow$ test $\rightarrow$ build $\rightarrow$ triển khai lên GitHub Pages và đóng gói container với Dockerfile + nginx.conf.
