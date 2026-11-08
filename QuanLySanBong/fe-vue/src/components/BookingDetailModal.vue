<script setup>
import { computed } from "vue";

const props = defineProps({ booking: { type: Object, default: null } });
const emit = defineEmits(["close"]);

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const rows = computed(() => {
  const b = props.booking;
  if (!b) return [];
  return [
    ["Mã đơn", b.id ? `#${b.id}` : "Chưa cập nhật"],
    ["Khách hàng", b.khachHang?.hoTen || b.tenKhachHang || b.hoTen || "Khách đặt sân"],
    ["Số điện thoại", b.khachHang?.soDienThoai || b.soDienThoai || b.sdt || "Chưa có"],
    ["Sân", b.tenSan || b.san?.tenSan || "Chưa cập nhật"],
    ["Ngày đá", b.ngayDat || "Chưa cập nhật"],
    ["Khung giờ", `${b.gioBatDau || "--:--"} - ${b.gioKetThuc || "--:--"}`],
    ["Giá", money(b.gia)],
    ["Trạng thái", b.trangThai || "Chưa cập nhật"],
  ];
});
</script>

<template>
  <div
    v-if="booking"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    @mousedown.self="emit('close')"
  >
    <section role="dialog" aria-modal="true" aria-labelledby="booking-detail-title" class="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
      <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-red-700">Chi tiết đặt sân</p>
          <h2 id="booking-detail-title" class="mt-1 text-xl font-black text-slate-950">Đơn {{ booking.id ? `#${booking.id}` : "đặt sân" }}</h2>
        </div>
        <button type="button" aria-label="Đóng chi tiết" class="rounded-lg px-2 py-1 text-xl font-bold text-slate-500 hover:bg-slate-100" @click="emit('close')">×</button>
      </div>
      <dl class="mt-4 divide-y divide-slate-100">
        <div v-for="[label, value] in rows" :key="label" class="flex justify-between gap-4 py-3 text-sm">
          <dt class="font-semibold text-slate-500">{{ label }}</dt>
          <dd class="text-right font-bold text-slate-900">{{ value }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
