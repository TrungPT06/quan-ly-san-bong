<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { adminApi } from "../../api/adminApi";
import { errorMessage } from "../../composables/useApiError";
import { dayTypeLabel } from "../../utils/statusLabels";
import { exclusiveAction } from "../../utils/exclusiveAction";

const emptySlot = () => ({ gioBatDau: "07:00", gioKetThuc: "08:00" });
const emptyPrice = () => ({ khungGioId: "", gia: "", loaiNgay: "TAT_CA" });

const loading = ref(true);
const busy = ref(false);
const fields = ref([]);
const slots = ref([]);
const prices = ref([]);
const selectedField = ref("");
const slotForm = reactive(emptySlot());
const priceForm = reactive(emptyPrice());
const editingPrice = ref(null);
const editingSlot = ref(null);
const error = ref("");
const message = ref("");

const hhmm = (value) => value?.slice(0, 5);
const loadSlots = async () => { slots.value = (await adminApi.getKhungGio()).data || []; };
const loadPrices = async () => {
  prices.value = selectedField.value ? (await adminApi.getGiaSan(selectedField.value)).data || [] : [];
};

async function loadAll() {
  loading.value = true;
  error.value = "";
  try {
    const [fieldResponse, slotResponse] = await Promise.all([adminApi.getSanBong(), adminApi.getKhungGio()]);
    fields.value = fieldResponse.data || [];
    slots.value = slotResponse.data || [];
    if (!fields.value.some((field) => String(field.id) === selectedField.value)) selectedField.value = String(fields.value[0]?.id || "");
    await loadPrices();
  } catch (err) {
    error.value = errorMessage(err, "Không tải được sân và khung giờ.");
  } finally {
    loading.value = false;
  }
}

// Đổi sân -> tải lại bảng giá của sân đó
watch(selectedField, async () => {
  prices.value = [];
  try { await loadPrices(); } catch (err) { error.value = errorMessage(err, "Không tải được bảng giá."); }
});

const saveSlot = exclusiveAction(async () => {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    if (editingSlot.value) await adminApi.suaKhungGio(editingSlot.value.id, { ...slotForm });
    else await adminApi.taoKhungGio({ ...slotForm });
    message.value = editingSlot.value ? "Đã sửa khung giờ." : "Đã tạo khung giờ.";
    editingSlot.value = null;
    await loadSlots();
  } catch (err) {
    error.value = errorMessage(err, "Không thể tạo khung giờ.");
  } finally {
    busy.value = false;
  }
});

function editSlot(slot) {
  editingSlot.value = slot;
  Object.assign(slotForm, { gioBatDau: hhmm(slot.gioBatDau), gioKetThuc: hhmm(slot.gioKetThuc) });
}
function cancelSlot() {
  editingSlot.value = null;
  Object.assign(slotForm, emptySlot());
}

const deleteSlot = exclusiveAction(async (slot) => {
  if (!window.confirm(`Xóa khung ${slot.gioBatDau} - ${slot.gioKetThuc}?`)) return;
  try {
    await adminApi.xoaKhungGio(slot.id);
    message.value = "Đã xóa khung giờ.";
    await loadSlots();
    await loadPrices();
  } catch (err) {
    error.value = errorMessage(err, "Không thể xóa khung giờ đang được sử dụng.");
  }
});

const savePrice = exclusiveAction(async () => {
  if (busy.value) return;
  if (!selectedField.value || !priceForm.khungGioId) {
    error.value = "Chọn sân và khung giờ trước.";
    return;
  }
  const payload = { sanId: Number(selectedField.value), khungGioId: Number(priceForm.khungGioId), gia: Number(priceForm.gia), loaiNgay: priceForm.loaiNgay };
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    if (editingPrice.value) await adminApi.suaGiaSan(editingPrice.value.id, payload);
    else await adminApi.taoGiaSan(payload);
    editingPrice.value = null;
    Object.assign(priceForm, emptyPrice());
    message.value = "Đã lưu bảng giá.";
    await loadPrices();
  } catch (err) {
    error.value = errorMessage(err, "Không thể lưu bảng giá.");
  } finally {
    busy.value = false;
  }
});

function editPrice(price) {
  editingPrice.value = price;
  Object.assign(priceForm, { khungGioId: String(price.khungGioId), gia: String(price.gia), loaiNgay: price.loaiNgay || "TAT_CA" });
}
function cancelPrice() {
  editingPrice.value = null;
  Object.assign(priceForm, emptyPrice());
}

const deletePrice = exclusiveAction(async (price) => {
  try {
    await adminApi.xoaGiaSan(price.id);
    message.value = "Đã xóa bảng giá.";
    await loadPrices();
  } catch (err) {
    error.value = errorMessage(err, "Không thể xóa bảng giá.");
  }
});

onMounted(loadAll);
</script>

<template>
  <section class="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
    <header>
      <p class="text-xs font-black uppercase tracking-[0.18em] text-red-700">Cấu hình vận hành</p>
      <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Khung giờ và giá sân</h1>
    </header>
    <p v-if="loading" role="status">Đang tải khung giờ và bảng giá…</p>
    <p v-if="busy" role="status">Đang lưu thay đổi…</p>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }} <button type="button" @click="loadAll">Thử lại</button></p>
    <p v-if="message" role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{{ message }}</p>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 class="text-lg font-black text-slate-900">Khung giờ dùng chung</h2>
        <form class="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" @submit.prevent="saveSlot">
          <label class="text-xs font-bold text-slate-600">Bắt đầu<input v-model="slotForm.gioBatDau" required type="time" class="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label class="text-xs font-bold text-slate-600">Kết thúc<input v-model="slotForm.gioKetThuc" required type="time" class="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <button :disabled="busy || loading" class="self-end rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">{{ editingSlot ? "Lưu giờ" : "Thêm giờ" }}</button>
          <button v-if="editingSlot" type="button" @click="cancelSlot">Hủy sửa</button>
        </form>
        <div class="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
          <div v-for="slot in slots" :key="slot.id" class="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
            <span class="font-bold text-slate-800">{{ hhmm(slot.gioBatDau) }} – {{ hhmm(slot.gioKetThuc) }}</span>
            <div class="flex gap-2">
              <button type="button" :disabled="busy" class="text-sm font-bold" @click="editSlot(slot)">Sửa</button>
              <button type="button" :disabled="busy" class="rounded-md px-2 py-1 text-xs font-bold text-red-700 hover:bg-red-50" @click="deleteSlot(slot)">Xóa</button>
            </div>
          </div>
          <p v-if="!slots.length" class="p-4 text-sm text-slate-500">Chưa có khung giờ.</p>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 class="text-lg font-black text-slate-900">Bảng giá theo sân</h2>
        <label class="mt-3 block text-xs font-bold text-slate-600">Sân
          <select v-model="selectedField" class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option v-for="field in fields" :key="field.id" :value="String(field.id)">{{ field.tenSan }}</option>
          </select>
        </label>
        <form class="mt-3 grid gap-3 sm:grid-cols-2" @submit.prevent="savePrice">
          <label class="text-xs font-bold text-slate-600">Khung giờ
            <select v-model="priceForm.khungGioId" required class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Chọn giờ</option>
              <option v-for="slot in slots" :key="slot.id" :value="String(slot.id)">{{ hhmm(slot.gioBatDau) }} – {{ hhmm(slot.gioKetThuc) }}</option>
            </select>
          </label>
          <label class="text-xs font-bold text-slate-600">Loại ngày
            <select v-model="priceForm.loaiNgay" class="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="TAT_CA">Tất cả ngày</option><option value="NGAY_THUONG">Ngày thường</option><option value="CUOI_TUAN">Cuối tuần</option>
            </select>
          </label>
          <label class="text-xs font-bold text-slate-600 sm:col-span-2">Giá (VNĐ)<input v-model="priceForm.gia" required min="1" step="1" type="number" class="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <div class="flex gap-2 sm:col-span-2">
            <button :disabled="busy || loading" class="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">{{ editingPrice ? "Cập nhật giá" : "Thêm giá" }}</button>
            <button v-if="editingPrice" type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700" @click="cancelPrice">Hủy sửa</button>
          </div>
        </form>
        <div class="mt-4 overflow-x-auto rounded-lg border border-slate-100">
          <table class="w-full min-w-[420px] text-left text-xs">
            <thead class="bg-slate-50 text-slate-500"><tr><th class="p-2.5">Khung giờ</th><th class="p-2.5">Loại ngày</th><th class="p-2.5">Giá</th><th class="p-2.5 text-right">Thao tác</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="price in prices" :key="price.id">
                <td class="p-2.5 font-semibold">{{ hhmm(price.gioBatDau) }} – {{ hhmm(price.gioKetThuc) }}</td>
                <td class="p-2.5">{{ dayTypeLabel(price.loaiNgay || "TAT_CA") }}</td>
                <td class="p-2.5 font-bold">{{ Number(price.gia).toLocaleString("vi-VN") }} đ</td>
                <td class="p-2.5 text-right">
                  <button type="button" class="mr-2 font-bold text-blue-700" @click="editPrice(price)">Sửa</button>
                  <button type="button" class="font-bold text-red-700" @click="deletePrice(price)">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!prices.length" class="p-3 text-sm text-slate-500">Sân chưa có bảng giá.</p>
        </div>
      </section>
    </div>
  </section>
</template>
