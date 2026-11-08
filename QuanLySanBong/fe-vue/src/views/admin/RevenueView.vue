<script setup>
import { computed, onMounted, ref } from "vue";
import { adminApi } from "../../api/adminApi";
import { daysBefore, validDateRange, vietnamDate } from "../../api/dates";

const todayIso = vietnamDate();
const monthStart = `${todayIso.slice(0, 7)}-01`;
const tuNgay = ref(monthStart);
const denNgay = ref(todayIso);
const stats = ref({ tongDoanhThu: 0, soGiaoDich: 0, doanhThuTheoNgay: [], doanhThuTheoSan: {}, doanhThuTheoCum: {} });
const error = ref("");
const loading = ref(false);

const money = (value) => Number(value || 0).toLocaleString("vi-VN");
const dateInput = "rounded-xl border border-[#E5E7EB] bg-[#F8F9FB] px-3 py-2 text-sm font-medium text-[#0B0F14] outline-none focus:border-[#DA1A32] focus:ring-4 focus:ring-[#DA1A32]/10";

async function load(start = tuNgay.value, end = denNgay.value) {
  if (!validDateRange(start, end)) {
    error.value = "Chọn khoảng ngày hợp lệ.";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    stats.value = (await adminApi.getRevenue(start, end)).data;
  } catch (err) {
    error.value = err.response?.data?.message || err.message || "Không tải được doanh thu.";
  } finally {
    loading.value = false;
  }
}
function pickWeek() {
  tuNgay.value = daysBefore(todayIso, 6);
  denNgay.value = todayIso;
  load();
}
function pickMonth() {
  tuNgay.value = monthStart;
  denNgay.value = todayIso;
  load();
}

// Các giá trị suy ra từ dữ liệu: dùng computed
const soNgay = computed(() => Math.max(1, Math.floor((new Date(`${denNgay.value}T00:00:00`) - new Date(`${tuNgay.value}T00:00:00`)) / 86400000) + 1));
const maxDaily = computed(() => Math.max(...(stats.value.doanhThuTheoNgay || []).map((item) => Number(item.giaTri || 0)), 1));
const average = computed(() => Math.round(Number(stats.value.tongDoanhThu || 0) / soNgay.value));
const breakdown = computed(() => [
  ...Object.entries(stats.value.doanhThuTheoSan || {}).map(([name, amount]) => [`Sân · ${name}`, amount]),
  ...Object.entries(stats.value.doanhThuTheoCum || {}).map(([name, amount]) => [`Cụm · ${name}`, amount]),
]);

onMounted(() => load(monthStart, todayIso));
</script>

<template>
  <div class="min-h-screen space-y-6 bg-[#F5F6F8] p-4 sm:p-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-black uppercase tracking-[0.22em] text-[#DA1A32]">Revenue</p>
        <h1 class="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B0F14]">Thống kê doanh thu</h1>
      </div>
      <div class="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B] shadow-sm">{{ tuNgay }} → {{ denNgay }}</div>
    </div>

    <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-4 shadow-[0_12px_28px_rgba(7,26,23,0.04)] sm:p-5">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex rounded-2xl border border-[#E5E7EB] bg-[#F8F9FB] p-1 text-xs font-black">
          <button type="button" class="rounded-xl bg-white px-3 py-1.5 text-[#0B0F14] shadow-sm" @click="pickWeek">Tuần</button>
          <button type="button" class="rounded-xl px-3 py-1.5 text-[#64748B]" @click="pickMonth">Tháng</button>
        </div>
        <input v-model="tuNgay" type="date" :class="dateInput" />
        <span class="text-[#64748B]">—</span>
        <input v-model="denNgay" type="date" :class="dateInput" />
        <button :disabled="loading" class="rounded-xl bg-[#DA1A32] px-4 py-2 text-sm font-black text-white hover:bg-[#B51228] disabled:opacity-60" @click="load()">{{ loading ? "Đang tải..." : "Lọc dữ liệu" }}</button>
      </div>
    </div>

    <p v-if="error" role="alert" class="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]"><span class="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B]">Tổng doanh thu</span><div class="mt-1 text-2xl font-black text-[#0B0F14]">{{ money(stats.tongDoanhThu) }} <span class="text-xs font-semibold text-[#64748B]">đồng</span></div></div>
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]"><span class="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B]">Số giao dịch thành công</span><div class="mt-1 text-2xl font-black text-[#0B0F14]">{{ stats.soGiaoDich || 0 }}</div></div>
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]"><span class="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B]">TB/ngày</span><div class="mt-1 text-2xl font-black text-[#0B0F14]">{{ money(average) }} <span class="text-xs font-semibold text-[#64748B]">đ</span></div></div>
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]"><span class="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B]">Số sân có doanh thu</span><div class="mt-1 text-2xl font-black text-[#B51228]">{{ Object.keys(stats.doanhThuTheoSan || {}).length }}</div></div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
        <h2 class="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#64748B]">Doanh thu theo ngày</h2>
        <div class="space-y-3">
          <div v-for="item in stats.doanhThuTheoNgay || []" :key="item.ngay" class="grid grid-cols-[80px_1fr_130px] items-center gap-3 text-xs">
            <span class="font-semibold text-[#64748B]">{{ item.ngay }}</span>
            <div class="h-2.5 rounded-full bg-[#F0F2F5]"><div class="h-2.5 rounded-full bg-gradient-to-r from-[#DA1A32] to-[#F8B9C2]" :style="{ width: `${Math.max(0, (Number(item.giaTri || 0) / maxDaily) * 100)}%` }" /></div>
            <span class="text-right font-bold text-[#0B0F14]">{{ money(item.giaTri) }} đ</span>
          </div>
        </div>
      </div>
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
        <h2 class="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[#64748B]">Theo sân / cụm</h2>
        <div class="space-y-2">
          <div v-for="[name, amount] in breakdown" :key="name" class="flex justify-between border-b border-[#E5E7EB] py-2.5 text-sm">
            <span class="text-[#64748B]">{{ name }}</span><strong class="font-black text-[#0B0F14]">{{ money(amount) }} đ</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
