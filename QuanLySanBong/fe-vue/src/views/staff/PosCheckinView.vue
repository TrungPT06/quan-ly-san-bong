<script setup>
import { ref } from "vue";
import { getResponseList, getStaffApiError, staffApi } from "../../api/staffApi";
import { exclusiveAction } from "../../utils/exclusiveAction";

const query = ref("");
const results = ref([]);
const loading = ref(false);
const busyId = ref(null);
const error = ref("");
const message = ref("");

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

async function search(preserveMessage = false) {
  if (!query.value.trim()) {
    error.value = "Nhập mã đơn hoặc số điện thoại để tìm kiếm.";
    return;
  }
  loading.value = true;
  error.value = "";
  if (preserveMessage !== true) message.value = "";
  try {
    const { data } = await staffApi.searchBooking(query.value.trim());
    const bookings = getResponseList(data);
    results.value = bookings;
    if (!bookings.length) error.value = "Không tìm thấy đơn đặt sân phù hợp.";
  } catch (err) {
    results.value = [];
    error.value = getStaffApiError(err, "Không tìm thấy đơn đặt sân phù hợp.");
  } finally {
    loading.value = false;
  }
}

const checkIn = exclusiveAction(async (booking) => {
  busyId.value = booking.id;
  error.value = "";
  message.value = "";
  try {
    await staffApi.checkIn(booking.id);
    message.value = `Đã xác nhận check-in cho đơn #${booking.id}.`;
    await search(true);
  } catch (err) {
    error.value = getStaffApiError(err, "Không xác nhận được check-in.");
  } finally {
    busyId.value = null;
  }
});

const buttonLabel = (booking) => {
  if (busyId.value === booking.id) return "Đang xác nhận...";
  if (booking.trangThai === "DA_CHECKIN") return "Đã check-in";
  return booking.trangThai === "DA_XAC_NHAN" ? "Xác nhận Check-in" : "Đơn chưa đủ điều kiện check-in";
};
</script>

<template>
  <section class="mx-auto w-full max-w-5xl p-4 sm:p-6">
    <div class="mb-5">
      <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Nhân viên Tại Sân</p>
      <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Quầy Check-in POS</h1>
      <p class="mt-1 text-sm text-slate-500">Tìm đơn bằng mã đặt sân, số điện thoại hoặc dữ liệu quét QR.</p>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="search()">
        <input v-model="query" autofocus inputmode="search" aria-label="Mã đơn, số điện thoại hoặc QR" placeholder="Mã đơn hoặc SĐT khách" class="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100" />
        <button type="submit" :disabled="loading" class="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50">{{ loading ? "Đang tìm..." : "Tìm kiếm" }}</button>
      </form>
      <p v-if="error" role="alert" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ error }}</p>
      <p v-if="message" role="status" class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{{ message }}</p>
    </div>

    <div class="mt-4 grid gap-3">
      <article v-for="booking in results" :key="booking.id" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span class="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-800">Đơn #{{ booking.id }}</span>
            <h2 class="mt-2 text-lg font-black text-slate-950">{{ booking.tenSan || booking.san?.tenSan || "Sân bóng" }}</h2>
          </div>
          <p class="text-lg font-black text-red-700">{{ money(booking.gia) }}</p>
        </div>
        <dl class="grid grid-cols-1 gap-3 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><dt class="text-xs font-semibold text-slate-500">Khách hàng</dt><dd class="mt-0.5 font-bold text-slate-900">{{ booking.tenKhachHang || booking.khachHang?.hoTen || "Khách đặt sân" }}</dd></div>
          <div><dt class="text-xs font-semibold text-slate-500">Số điện thoại</dt><dd class="mt-0.5 font-bold text-slate-900">{{ booking.soDienThoai || booking.khachHang?.soDienThoai || "Chưa có" }}</dd></div>
          <div><dt class="text-xs font-semibold text-slate-500">Ngày đá</dt><dd class="mt-0.5 font-bold text-slate-900">{{ booking.ngayDat || "Chưa cập nhật" }}</dd></div>
          <div><dt class="text-xs font-semibold text-slate-500">Khung giờ</dt><dd class="mt-0.5 font-bold text-slate-900">{{ booking.gioBatDau || "--:--" }} - {{ booking.gioKetThuc || "--:--" }}</dd></div>
          <div><dt class="text-xs font-semibold text-slate-500">Trạng thái</dt><dd class="mt-0.5 font-bold text-slate-900">{{ booking.trangThai || "Chưa cập nhật" }}</dd></div>
        </dl>
        <button type="button" :disabled="booking.trangThai !== 'DA_XAC_NHAN' || busyId !== null" class="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300" @click="checkIn(booking)">{{ buttonLabel(booking) }}</button>
      </article>
    </div>
  </section>
</template>
