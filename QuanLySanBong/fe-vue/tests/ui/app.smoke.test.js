import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

const courts = [{ id: 1, tenSan: "Sân Alpha", tenCumSan: "Cụm A", loaiSan: "Sân 5", giaThapNhat: 150000, trangThai: "HOAT_DONG" }];
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal("fetch", async (url) => {
    const u = String(url);
    if (u.includes("lich-trong")) return json([{ khungGioId: 1, gioBatDau: "07:00:00", gioKetThuc: "08:00:00", gia: 200000, trangThai: "TRONG" }]);
    if (u.includes("/api/san")) return json(courts);
    if (u.includes("/admin/dashboard")) return json({ tongLuotDat: 3, tongDoanhThuTuan: 1500000, tongKhachHang: 4, doanhThuTheoNgay: [{ ngay: "T2", giaTri: 100 }] });
    if (u.includes("/api/admin/san")) return json(courts);
    return json([]);
  });
});

async function boot(path) {
  vi.resetModules();
  setActivePinia(createPinia());
  const pinia = createPinia();
  const { default: App } = await import("../../src/App.vue");
  const { default: router } = await import("../../src/router/index.js");
  router.push(path); await router.isReady();
  const w = mount(App, { global: { plugins: [pinia, router] }, attachTo: document.body });
  await flushPromises(); await flushPromises();
  return { w, router };
}

describe("smoke", () => {
  it("trang chủ hiển thị hero, danh sách sân và nút chatbot", async () => {
    const { w } = await boot("/");
    expect(w.html()).toContain("ĐẶT GIỜ");
    expect(w.html()).toContain("Sân Alpha");
    expect(w.html()).toContain("Tư vấn AI");
  });
  it("lọc theo từ khóa", async () => {
    const { w } = await boot("/tim-san");
    await w.find('input[type="search"]').setValue("khong co");
    expect(w.html()).toContain("Chưa tìm thấy sân phù hợp");
  });
  it("chi tiết sân (dynamic route) hiển thị khung giờ và chọn được slot", async () => {
    const { w } = await boot("/san/1");
    expect(w.html()).toContain("Sân Alpha");
    const slot = w.find("button.booking-slot");
    expect(slot.exists()).toBe(true);
    await slot.trigger("click");
    expect(w.html()).toContain("200.000");
    expect(w.find("button.booking-submit").attributes("disabled")).toBeUndefined();
  });
  it("guard: khách vào /admin bị chuyển sang đăng nhập", async () => {
    const { w, router } = await boot("/admin/dashboard");
    expect(router.currentRoute.value.name).toBe("login");
    expect(w.html()).toContain("Đăng nhập");
  });
  it("guard: khách hàng vào /admin bị 403", async () => {
    localStorage.setItem("phien", JSON.stringify({ role: "KHACH_HANG", hoTen: "QA" }));
    const { w, router } = await boot("/admin/dashboard");
    expect(router.currentRoute.value.name).toBe("forbidden");
    expect(w.html()).toContain("403");
  });
  it("admin vào dashboard với layout điều hành, redirect từ /admin", async () => {
    localStorage.setItem("phien", JSON.stringify({ role: "ADMIN", hoTen: "Ad" }));
    const { w, router } = await boot("/admin");
    expect(router.currentRoute.value.path).toBe("/admin/dashboard");
    expect(w.html()).toContain("Tổng quan");
    expect(w.html()).toContain("Quản lý Sân Bóng");
    expect(w.html()).not.toContain("Tư vấn AI");
  });
  it("chatbot mở được và hiển thị lời chào", async () => {
    const { w } = await boot("/");
    await w.find(".ai-chat-fab").trigger("click");
    expect(w.html()).toContain("Xin chào! Mình là trợ lý");
  });
});
