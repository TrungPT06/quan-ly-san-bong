import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// VITE_BASE: đường dẫn gốc khi deploy (GitHub Pages dạng /ten-repo/, Vercel/Netlify để mặc định /)
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [vue()],
  server: { port: 3004, host: true },
});
