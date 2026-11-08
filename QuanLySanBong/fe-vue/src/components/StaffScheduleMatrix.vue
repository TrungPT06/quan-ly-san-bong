<script setup>
import { computed, ref, watch } from "vue";
import { getStaffApiError, staffApi } from "../api/staffApi";

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
});
const emit = defineEmits(["select-booking"]);

const OCCUPIED = ["DA_DAT", "DA_XAC_NHAN", "HOAN_THANH", "DA_CHECKIN"];
const HOLDING = ["GIU_CHO_TAM", "CHO_THANH_TOAN", "CHO_XAC_NHAN"];

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}
function slotTone(status) {
  if (status === "KHONG_HOAT_DONG") return "border-slate-200 bg-slate-100 text-slate-500";
  if (OCCUPIED.includes(status)) return "border-red-200 bg-red-50 text-red-900";
  if (HOLDING.includes(status)) return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-emerald-200 bg-emerald-50 text-emerald-950";
}
function slotLabel(status) {
  if (status === "KHONG_HOAT_DONG") return "Không thể đặt mới";
  if (OCCUPIED.includes(status)) return "Đã đặt";
  if (HOLDING.includes(status)) return "Giữ chỗ tạm";
  return "Trống";
}

const ngay = ref(todayLocal());
const matrix = ref([]);
const loading = ref(true);
const error = ref("");
let requestId = 0;

async function load() {
  const current = ++requestId;
  loading.value = true;
  error.value = "";
  try {
    const { data } = await staffApi.getScheduleMatrix(ngay.value);
    if (current === requestId) matrix.value = Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    if (current === requestId) error.value = getStaffApiError(err, "Không tải được ma trận sân.");
  } finally {
    if (current === requestId) loading.value = false;
  }
}
watch(ngay, load, { immediate: true });

// Các cột khung giờ = hợp của mọi khung giờ ở mọi sân, sắp theo giờ bắt đầu
const slotColumns = computed(() =>
  Array.from(new Map(matrix.value.flatMap((field) => field.slots || []).map((slot) => [slot.khungGioId, slot])).values()).sort((a, b) =>
    (a.gioBatDau || "").localeCompare(b.gioBatDau || ""),
  ),
);
const rows = computed(() =>
  matrix.value.map((field) => {
    const byId = new Map((field.slots || []).map((slot) => [slot.khungGioId, slot]));
    return { field, cells: slotColumns.value.map((column) => ({ column, slot: byId.get(column.khungGioId) })) };
  }),
);
const gridStyle = computed(() => ({ gridTemplateColumns: `minmax(180px, 220px) repeat(${slotColumns.value.length}, minmax(140px, 1fr))` }));

function select(field, slot) {
  emit("select-booking", {
    ...slot,
    id: slot.datSanId ?? slot.id,
    sanId: field.sanId,
    tenSan: field.tenSan,
    ngayDat: ngay.value,
    trangThai: slot.trangThai || "TRONG",
  });
}
</script>

<template>
  <section class="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
    <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-red-700">Vận hành sân bóng</p>
        <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{{ title }}</h1>
        <p class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <label class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wide text-slate-500">Ngày</span>
        <input v-model="ngay" aria-label="Chọn ngày xem lịch sân" type="date" class="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100" />
      </label>
    </div>

    <div class="mb-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
      <span class="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2"><span class="h-3 w-3 rounded-sm bg-emerald-200" /> Trống</span>
      <span class="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2"><span class="h-3 w-3 rounded-sm bg-amber-300" /> Giữ chỗ tạm</span>
      <span class="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2"><span class="h-3 w-3 rounded-sm bg-red-300" /> Đã đặt</span>
    </div>

    <div v-if="error" role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{{ error }}</div>

    <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-sm">Đang tải lịch sân...</div>
    <div v-else-if="matrix.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">Không có dữ liệu sân trong ngày đã chọn.</div>
    <div v-else class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="grid min-w-max" :style="gridStyle">
        <div class="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 p-3 text-xs font-black uppercase tracking-wide text-slate-600">Sân bóng</div>
        <div v-for="slot in slotColumns" :key="slot.khungGioId" class="border-b border-r border-slate-200 bg-slate-50 p-3 text-center text-xs font-black text-slate-700">
          {{ slot.gioBatDau?.slice(0, 5) }} - {{ slot.gioKetThuc?.slice(0, 5) }}
        </div>

        <div v-for="row in rows" :key="row.field.sanId" class="contents">
          <div class="sticky left-0 z-[1] border-b border-r border-slate-200 bg-white p-3">
            <p class="text-sm font-extrabold text-slate-900">{{ row.field.tenSan || `Sân ${row.field.sanId}` }}</p>
            <p class="mt-0.5 text-xs font-medium text-slate-500">{{ row.field.loaiSan || "Sân bóng" }}</p>
          </div>
          <template v-for="cell in row.cells" :key="cell.column.khungGioId">
            <div v-if="!cell.slot" class="border-b border-r border-slate-200 bg-slate-50/60 p-2" />
            <div v-else class="border-b border-r border-slate-200 p-2">
              <component
                :is="cell.slot.datSanId ? 'button' : 'div'"
                :type="cell.slot.datSanId ? 'button' : undefined"
                :class="['flex min-h-[82px] w-full flex-col justify-center rounded-lg border px-2 py-2 text-center', slotTone(cell.slot.trangThai || 'TRONG'), cell.slot.datSanId ? 'cursor-pointer transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-red-600' : '']"
                @click="cell.slot.datSanId ? select(row.field, cell.slot) : undefined"
              >
                <span class="text-[11px] font-black">{{ slotLabel(cell.slot.trangThai || "TRONG") }}</span>
                <span class="mt-1 text-xs font-bold">{{ Number(cell.slot.gia || 0).toLocaleString("vi-VN") }} đ</span>
                <span v-if="cell.slot.tenKhachHang" class="mt-1 max-w-full truncate text-[11px]">{{ cell.slot.tenKhachHang }}</span>
              </component>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
