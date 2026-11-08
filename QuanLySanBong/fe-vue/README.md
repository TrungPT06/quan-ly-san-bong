# SÂN BÓNG PRO — Frontend (Vue 3)

Ứng dụng Single Page Application đặt sân bóng, viết bằng **Vue 3 (Composition API, `<script setup>`)**, **Vue Router 4**, **Pinia**, **Tailwind CSS**, tích hợp **chatbot AI (Gemini/OpenAI)** và pipeline **CI/CD GitHub Actions**. Backend Spring Boot giữ nguyên (thư mục `be/`).

## Chạy thử

```bash
npm install
cp .env.example .env     # điền VITE_AI_API_KEY nếu muốn dùng chatbot
npm run dev              # http://localhost:3004
```

| Lệnh | Tác dụng |
| --- | --- |
| `npm run lint` | ESLint + eslint-plugin-vue |
| `npm test` | Unit test: API client, store Pinia, API AI (node:test) |
| `npm run test:ui` | Smoke test component + router (Vitest, jsdom) |
| `npm run build` | Build production vào `dist/` |

## Biến môi trường

| Biến | Ý nghĩa |
| --- | --- |
| `VITE_API_BASE_URL` | URL backend; để trống nếu dùng cùng origin `/api` (nginx proxy) |
| `VITE_AI_PROVIDER` | `gemini` (mặc định) hoặc `openai` |
| `VITE_AI_API_KEY` | Khóa API của nhà cung cấp AI |
| `VITE_AI_MODEL` | Tên model (mặc định `gemini-2.5-flash` / `gpt-4o-mini`) |
| `VITE_BASE` | Đường dẫn gốc khi deploy (GitHub Pages: `/<tên-repo>/`) |

> **Bảo mật:** biến `VITE_*` được nhúng vào bundle nên khóa AI nhìn thấy được trong trình duyệt. Chỉ dùng khóa giới hạn quota/domain cho demo; khi chạy thật nên gọi AI qua một endpoint backend.

## Cấu trúc

```
src/
├─ main.js, App.vue          # khởi tạo app, chọn layout theo vai trò, gắn chatbot
├─ router/index.js           # route cha/con (/admin, /staff-page, /onsite), dynamic route /san/:id, guard phân quyền
├─ stores/                   # Pinia
│  ├─ auth.js                # phiên đăng nhập, vai trò (getters)
│  ├─ booking.js             # "giỏ hàng" đặt sân: sân + ngày + khung giờ, tổng tiền, checkout
│  ├─ courts.js              # danh sách sân + bộ lọc (computed)
│  ├─ favorites.js           # sân yêu thích
│  └─ chat.js                # hội thoại chatbot AI
├─ api/                      # http client, adminApi, staffApi, aiApi (Gemini/OpenAI)...
├─ components/               # Brand, CourtCard, CourtSearchBar, AIChatbot, DialogShell, charts...
├─ layouts/                  # PublicLayout, OperationsLayout
└─ views/                    # trang khách hàng, views/staff, views/admin
```

## CI/CD

`.github/workflows/ci-cd.yml`: mỗi lần push/PR vào `main` chạy `lint → test → test:ui → build`; push vào `main` thì tự deploy lên **GitHub Pages**. Cần bật *Settings → Pages → Source: GitHub Actions* và khai báo biến/secret ở *Settings → Secrets and variables → Actions* (`VITE_API_BASE_URL`, `VITE_AI_PROVIDER`, `VITE_AI_MODEL` là variable; `VITE_AI_API_KEY` là secret). Trang HTTPS không gọi được backend HTTP thường (mixed content) nên `VITE_API_BASE_URL` phải là HTTPS.

Vercel/Netlify cũng dùng được (`vercel.json`, `public/_redirects` đã có rewrite SPA). Pipeline GitLab + Docker/nginx cũ (`.gitlab-ci.yml`, `Dockerfile`) vẫn chạy được vì vẫn build ra `dist/`.
