import { RouterView, createRouter, createWebHistory } from "vue-router";
import { h } from "vue";
import { useAuthStore, homeFor } from "../stores/auth";

// Component rỗng cho route cha: chỉ để lồng <router-view> của route con
const Outlet = { render: () => h(RouterView) };

const ALL_PUBLIC = ["guest", "customer"];
const OPS = { requiresAuth: true };

const routes = [
  // ---- Khu vực khách / khách hàng ----
  { path: "/", name: "home", component: () => import("../views/HomeView.vue"), meta: { roles: ALL_PUBLIC } },
  { path: "/tim-san", name: "search", component: () => import("../views/HomeView.vue"), props: { listing: true }, meta: { roles: ALL_PUBLIC } },
  // Dynamic routing: truyền tham số :id xuống component dưới dạng props
  {
    path: "/san/:id(\\d+)",
    name: "field-detail",
    component: () => import("../views/FieldDetailView.vue"),
    props: (route) => ({ fieldId: Number(route.params.id) }),
    meta: { roles: ALL_PUBLIC },
  },
  { path: "/yeu-thich", name: "favorites", component: () => import("../views/FavoritesView.vue"), meta: { roles: ALL_PUBLIC } },
  { path: "/lich-su-dat-san", alias: "/lich-su", name: "history", component: () => import("../views/BookingHistoryView.vue"), meta: { requiresAuth: true, roles: ["customer"] } },
  { path: "/ho-so", name: "profile", component: () => import("../views/ProfileView.vue"), meta: { requiresAuth: true } },
  { path: "/ket-qua-thanh-toan", name: "payment-result", component: () => import("../views/PaymentResultView.vue") },
  { path: "/quen-mat-khau", name: "forgot-password", component: () => import("../views/ForgotPasswordView.vue"), meta: { roles: ALL_PUBLIC } },

  // ---- Đăng nhập / đăng ký (không dùng layout chung) ----
  { path: "/dang-nhap", name: "login", component: () => import("../views/LoginView.vue"), meta: { bare: true } },
  { path: "/dang-ky", name: "register", component: () => import("../views/RegisterView.vue"), meta: { bare: true } },

  // ---- Quản trị: route cha /admin + các route con ----
  {
    path: "/admin",
    component: Outlet,
    redirect: { name: "admin-dashboard" },
    meta: { ...OPS, roles: ["admin"] },
    children: [
      { path: "dashboard", name: "admin-dashboard", component: () => import("../views/admin/DashboardView.vue") },
      { path: "quan-ly-san", name: "admin-san", component: () => import("../views/admin/CourtManagementView.vue") },
      { path: "khung-gio-gia", name: "admin-schedule", component: () => import("../views/admin/ScheduleView.vue") },
      { path: "cum-san", name: "admin-cum-san", component: () => import("../views/admin/ClusterView.vue") },
      { path: "thanh-toan", name: "admin-payments", component: () => import("../views/admin/PaymentsView.vue") },
      { path: "khach-hang", name: "admin-customers", component: () => import("../views/admin/CustomersView.vue") },
      { path: "nhan-vien", name: "admin-staff", component: () => import("../views/admin/StaffView.vue") },
      { path: "doanh-thu", name: "admin-revenue", component: () => import("../views/admin/RevenueView.vue") },
      { path: "bao-cao", name: "admin-report", component: () => import("../views/admin/ReportView.vue") },
    ],
  },

  // ---- Nhân viên trực page ----
  {
    path: "/staff-page",
    component: Outlet,
    redirect: { name: "staffpage-matrix" },
    meta: { ...OPS, roles: ["staff_page"] },
    children: [
      { path: "requests", name: "staffpage-requests", component: () => import("../views/staff/BookingRequestsView.vue") },
      { path: "matrix", alias: "/ma-tran-lich", name: "staffpage-matrix", component: () => import("../views/staff/ScheduleMatrixView.vue") },
    ],
  },

  // ---- Nhân viên tại sân ----
  {
    path: "/onsite",
    component: Outlet,
    redirect: { name: "onsite-pos" },
    meta: { ...OPS, roles: ["staff_onsite"] },
    children: [
      { path: "pos", alias: "/pos", name: "onsite-pos", component: () => import("../views/staff/PosCheckinView.vue") },
      { path: "thanh-toan", name: "onsite-payments", component: () => import("../views/admin/PaymentsView.vue") },
      { path: "walkin", name: "onsite-walkin", component: () => import("../views/staff/WalkinBookingView.vue") },
      { path: "matrix", name: "onsite-matrix", component: () => import("../views/staff/ScheduleMatrixView.vue") },
    ],
  },

  { path: "/403", name: "forbidden", component: () => import("../views/ForbiddenView.vue") },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, top: 0 };
    return { top: 0, left: 0 };
  },
});

// Route guard: kiểm tra đăng nhập và phân quyền theo vai trò
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.name === "home" && auth.isOperations) return homeFor(auth.role);
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  const roles = to.meta.roles;
  if (roles && auth.role !== "admin" && !roles.includes(auth.role)) {
    // Đã đăng nhập nhưng sai vai trò -> 403; chưa đăng nhập -> về trang đăng nhập
    return auth.isLoggedIn ? { name: "forbidden" } : { name: "login", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
