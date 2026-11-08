<script setup>
import { computed, ref } from "vue";
import { adminApi } from "../../api/adminApi";
import { daysBefore, validDateRange, vietnamDate } from "../../api/dates";
import { exclusiveAction } from "../../utils/exclusiveAction";

const todayIso = vietnamDate();
const monthStart = `${todayIso.slice(0, 7)}-01`;
const tuNgay = ref(monthStart);
const denNgay = ref(todayIso);
const error = ref("");
const loading = ref("");
const downloadUrl = ref("");

const quickRanges = computed(() => [
  { ten: `Hôm nay (${todayIso})`, start: todayIso, end: todayIso },
  { ten: `7 ngày gần nhất (${daysBefore(todayIso, 6)} → ${todayIso})`, start: daysBefore(todayIso, 6), end: todayIso },
  { ten: `Tháng ${todayIso.slice(0, 7)}`, start: monthStart, end: todayIso },
]);
const dateInput = "mt-1 w-full rounded-2xl border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2 text-sm text-[#0B0F14] outline-none focus:border-[#DA1A32] focus:ring-4 focus:ring-[#DA1A32]/10";

const exportReport = exclusiveAction(async (format, start = tuNgay.value, end = denNgay.value) => {
  if (loading.value) return;
  if (!validDateRange(start, end)) {
    error.value = "Chọn khoảng ngày hợp lệ.";
    return;
  }
  downloadUrl.value = "";
  loading.value = format;
  error.value = "";
  try {
    const res = format === "Excel" ? await adminApi.exportExcel(start, end) : await adminApi.exportPdf(start, end);
    if (!res.data?.url) throw new Error("Hệ thống chưa trả đường dẫn báo cáo.");
    const url = new URL(res.data.url, window.location.origin);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Đường dẫn không hợp lệ.");
    downloadUrl.value = url.href;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || `Xuất ${format} thất bại.`;
  } finally {
    loading.value = "";
  }
});
</script>

<template>
  <div class="min-h-screen space-y-6 bg-[#F5F6F8] p-4 sm:p-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-black uppercase tracking-[0.22em] text-[#DA1A32]">Reports</p>
        <h1 class="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B0F14]">Xuất báo cáo tài chính</h1>
      </div>
      <div class="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B] shadow-sm">Báo cáo doanh thu</div>
    </div>

    <p v-if="error" role="alert" class="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>
    <a v-if="downloadUrl" :href="downloadUrl" target="_blank" rel="noopener noreferrer" class="block rounded-xl bg-emerald-50 p-4 font-bold text-red-700">Báo cáo đã sẵn sàng — nhấn để tải (liên kết có thời hạn)</a>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="space-y-4 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
        <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-[#64748B]">Tạo báo cáo tùy chỉnh</h3>
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-[#64748B]" for="report-type">Loại báo cáo</label>
          <select id="report-type" class="w-full rounded-2xl border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2.5 text-sm font-medium text-[#0B0F14] outline-none transition focus:border-[#DA1A32] focus:ring-4 focus:ring-[#DA1A32]/10">
            <option>Báo cáo tổng hợp doanh thu</option>
            <option disabled>Tần suất đặt sân — chưa có API</option>
            <option disabled>Khách thân thiết — chưa có API</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="text-sm font-semibold text-[#64748B]">Từ ngày<input v-model="tuNgay" type="date" :class="dateInput" /></label>
          <label class="text-sm font-semibold text-[#64748B]">Đến ngày<input v-model="denNgay" type="date" :class="dateInput" /></label>
        </div>
        <div class="flex gap-3 pt-1">
          <button :disabled="Boolean(loading)" class="flex-1 rounded-2xl bg-[#DA1A32] px-4 py-3 text-sm font-black text-white hover:bg-[#B51228] disabled:opacity-60" @click="exportReport('Excel')">{{ loading === "Excel" ? "Đang xuất..." : "Xuất Excel" }}</button>
          <button :disabled="Boolean(loading)" class="flex-1 rounded-2xl border border-[#bfead9] bg-[#FFF0F2] px-4 py-3 text-sm font-black text-[#B51228] hover:bg-[#FDE5E9] disabled:opacity-60" @click="exportReport('PDF')">{{ loading === "PDF" ? "Đang xuất..." : "Xuất PDF" }}</button>
        </div>
      </div>

      <div class="space-y-3 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
        <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-[#64748B]">Tải nhanh báo cáo kỳ</h3>
        <div v-for="item in quickRanges" :key="item.ten" class="flex items-center justify-between rounded-2xl bg-[#F8F9FB] p-3 text-sm font-medium text-[#0B0F14]">
          <span>{{ item.ten }}</span>
          <div class="space-x-2">
            <button class="font-bold text-[#B51228] hover:underline" @click="exportReport('Excel', item.start, item.end)">Excel</button>
            <button class="font-bold text-[#0f6fe8] hover:underline" @click="exportReport('PDF', item.start, item.end)">PDF</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
