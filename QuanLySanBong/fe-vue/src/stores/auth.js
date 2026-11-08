import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { getPhien, xoaPhien, SESSION_EVENT } from "../api/http";
import { authApi } from "../api/authApi";

// Ánh xạ vai trò từ Backend Spring Boot sang khóa vai trò ở Frontend
const VAI_TRO_TO_ROLE = {
  KHACH_HANG: "customer",
  NHAN_VIEN_PAGE: "staff_page",
  NHAN_VIEN_SAN: "staff_onsite",
  ADMIN: "admin",
  ROLE_ADMIN: "admin",
};

export function extractRole(phien) {
  if (!phien) return "guest";
  const r = phien.role || phien.vaiTro || phien.user?.role || phien.user?.vaiTro;
  if (r === "admin") return "admin";
  return VAI_TRO_TO_ROLE[r] || "customer";
}

export function homeFor(role) {
  return { admin: "/admin/dashboard", staff_page: "/staff-page/matrix", staff_onsite: "/onsite/pos" }[role] || "/";
}

export const useAuthStore = defineStore("auth", () => {
  // State
  const session = ref(getPhien());

  // Getters
  const role = computed(() => extractRole(session.value));
  const isLoggedIn = computed(() => !!session.value);
  const isOperations = computed(() => ["admin", "staff_page", "staff_onsite"].includes(role.value));
  const displayName = computed(() => {
    const raw = session.value?.hoTen || session.value?.username || "Người dùng";
    return raw.includes("@") ? raw.split("@")[0] : raw;
  });

  // Actions
  function sync() {
    session.value = getPhien();
  }
  function listen() {
    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);
  }
  async function login(username, password, remember = true) {
    const phien = await authApi.dangNhap(username, password, remember);
    sync();
    return phien;
  }
  function logout() {
    xoaPhien();
    sync();
  }

  return { session, role, isLoggedIn, isOperations, displayName, sync, listen, login, logout };
});
