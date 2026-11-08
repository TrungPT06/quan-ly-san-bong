<script setup>
import { computed, onMounted, ref } from "vue";
import FieldTypeChart from "../../components/FieldTypeChart.vue";
import RevenueLineChart from "../../components/RevenueLineChart.vue";
import { adminApi } from "../../api/adminApi";

const stats = ref({ tongDoanhThuTuan: 0, tongKhachHang: 0, tongNhanVien: 0, tongLuotDat: 0, doanhThuTheoNgay: [], doanhThuTheoCum: {} });
const inventory = ref([]);
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [res, fieldRes] = await Promise.all([adminApi.getDashboard(), adminApi.getSanBong()]);
    stats.value = res.data;
    inventory.value = fieldRes.data || [];
  } catch (err) {
    error.value = err.message || "Không thể tải dashboard.";
  } finally {
    loading.value = false;
  }
}

const statCards = computed(() => [
  { label: "Tổng sân bóng", value: inventory.value.length, unit: "sân", icon: "⚽", className: "bg-red-50" },
  { label: "Đơn đặt tuần này", value: stats.value.tongLuotDat || 0, unit: "đơn", icon: "▦", className: "bg-green-50" },
  { label: "Doanh thu tuần", value: ((stats.value.tongDoanhThuTuan || 0) / 1000000).toFixed(2), unit: "triệu đ", icon: "↗", className: "bg-amber-50" },
  { label: "Khách hàng", value: stats.value.tongKhachHang || 0, unit: "người", icon: "♙", className: "bg-blue-50" },
]);

onMounted(load);
</script>

<template>
  <p v-if="loading" role="status" class="p-8">Đang tải tổng quan...</p>
  <div v-else-if="error" role="alert" class="p-8 text-red-700">{{ error }} <button @click="load">Thử lại</button></div>
  <div v-else class="min-h-screen space-y-6 bg-[#F5F6F8] p-4 sm:p-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-black uppercase tracking-[0.22em] text-[#DA1A32]">Trung tâm điều hành</p>
        <h1 class="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B0F14]">Tổng quan</h1>
      </div>
      <div class="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#64748B] shadow-sm">Dữ liệu từ hệ thống</div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in statCards" :key="card.label" class="flex items-center gap-4 rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
        <div :class="['flex h-12 w-12 items-center justify-center rounded-2xl text-xl', card.className]">{{ card.icon }}</div>
        <div>
          <span class="text-[11px] font-black uppercase tracking-[0.18em] text-[#64748B]">{{ card.label }}</span>
          <div class="mt-1 text-2xl font-black text-[#0B0F14]">{{ card.value }}<span class="ml-1 text-xs font-semibold text-[#64748B]">{{ card.unit }}</span></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
        <div class="mb-5 flex items-center justify-between gap-3">
          <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-[#64748B]">Doanh thu theo ngày</h3>
          <span class="rounded-full bg-[#FFF0F2] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#B51228]">Tuần này</span>
        </div>
        <RevenueLineChart :rows="stats.doanhThuTheoNgay || []" />
      </div>
      <div class="rounded-[12px] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
        <h3 class="text-[11px] font-black uppercase tracking-[0.1em] text-[#64748B]">Tỷ lệ loại sân</h3>
        <FieldTypeChart :fields="inventory" />
      </div>
    </div>
  </div>
</template>
