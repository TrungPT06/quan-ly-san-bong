<script setup>
import { computed, ref, watch } from "vue";
import { vietnamDate } from "../../api/dates";
import { getStaffApiError, staffApi } from "../../api/staffApi";
import { exclusiveAction } from "../../utils/exclusiveAction";

const today = vietnamDate();
const ngayDat = ref(today);
const matrix = ref([]);
const sanId = ref("");
const khungGioId = ref("");
const tenKhachHang = ref("");
const soDienThoai = ref("");
const phuongThucThanhToan = ref("TIEN_MAT");
const loadingSchedule = ref(true);
const submitting = ref(false);
const error = ref("");
const createdBooking = ref(null);
const reloadKey = ref(0);

const inputClass = "mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100";
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

// Chỉ giữ sân còn khung giờ trống
const availableFields = computed(() =>
  matrix.value
    .map((field) => ({ ...field, slots: (field.slots || []).filter((slot) => slot.trangThai === "TRONG") }))
    .filter((field) => field.slots.length > 0),
);
const currentField = computed(() => availableFields.value.find((field) => String(field.sanId) === sanId.value));

let requestId = 0;
async function loadSchedule() {
  const current = ++requestId;
  loadingSchedule.value = true;
  error.value = "";
  try {
    const { data } = await staffApi.getScheduleMatrix(ngayDat.value);
    if (current === requestId) matrix.value = Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    if (current === requestId) error.value = getStaffApiError(err, "Không tải được khung giờ trống.");
  } finally {
    if (current === requestId) loadingSchedule.value = false;
  }
}
watch([ngayDat, reloadKey], loadSchedule, { immediate: true });
// Đổi ngày hoặc đổi sân -> bỏ lựa chọn cũ
watch(ngayDat, () => { sanId.value = ""; khungGioId.value = ""; });
watch(sanId, () => { khungGioId.value = ""; });

const submit = exclusiveAction(async () => {
  if (submitting.value) return;
  error.value = "";
  createdBooking.value = null;
  if (!["TIEN_MAT", "CHUYEN_KHOAN"].includes(phuongThucThanhToan.value)) {
    error.value = "Chỉ hỗ trợ tiền mặt hoặc chuyển khoản thủ công tại quầy.";
    return;
  }
  if (!sanId.value || !khungGioId.value) {
    error.value = "Chọn sân và khung giờ đang trống.";
    return;
  }
  submitting.value = true;
  try {
    const { data } = await staffApi.createWalkinBooking({
      sanId: Number(sanId.value),
      khungGioId: Number(khungGioId.value),
      ngayDat: ngayDat.value,
      tenKhachHang: tenKhachHang.value.trim(),
      soDienThoai: soDienThoai.value.trim(),
      phuongThucThanhToan: phuongThucThanhToan.value,
    });
    createdBooking.value = data;
    tenKhachHang.value = "";
    soDienThoai.value = "";
    sanId.value = "";
    khungGioId.value = "";
    reloadKey.value++;
  } catch (err) {
    error.value = getStaffApiError(err, "Không tạo được đơn tại quầy.");
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <section class="mx-auto w-full max-w-3xl p-4 sm:p-6">
    <div class="mb-5">
      <p class="text-xs font-black uppercase tracking-[0.18em] text-orange-700">Nhân viên Tại Sân</p>
      <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Đặt sân nhanh tại quầy</h1>
      <p class="mt-1 text-sm text-slate-500">Đơn tại quầy được xác nhận ngay, không qua bước duyệt online.</p>
    </div>

    <p v-if="error" role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>
    <p v-if="createdBooking" role="status" class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Đã tạo đơn #{{ createdBooking.id || "mới" }} · trạng thái {{ createdBooking.trangThai || "DA_XAC_NHAN" }}.</p>

    <form class="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" @submit.prevent="submit">
      <label class="block text-sm font-bold text-slate-700">Ngày đặt
        <input v-model="ngayDat" type="date" required :min="today" :class="inputClass" />
      </label>
      <p v-if="loadingSchedule" class="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-500">Đang tải sân và giờ trống...</p>
      <div v-else class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-bold text-slate-700">Sân
          <select v-model="sanId" required :class="[inputClass, 'bg-white']">
            <option value="">Chọn sân còn trống</option>
            <option v-for="field in availableFields" :key="field.sanId" :value="String(field.sanId)">{{ field.tenSan || `Sân ${field.sanId}` }}</option>
          </select>
        </label>
        <label class="block text-sm font-bold text-slate-700">Khung giờ trống
          <select v-model="khungGioId" required :disabled="!currentField" :class="[inputClass, 'bg-white disabled:bg-slate-100']">
            <option value="">Chọn khung giờ</option>
            <option v-for="slot in currentField?.slots || []" :key="slot.khungGioId" :value="String(slot.khungGioId)">{{ slot.gioBatDau?.slice(0, 5) }} - {{ slot.gioKetThuc?.slice(0, 5) }} · {{ money(slot.gia) }}</option>
          </select>
        </label>
      </div>
      <p v-if="!loadingSchedule && availableFields.length === 0" class="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">Không có khung giờ trống trong ngày đã chọn.</p>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm font-bold text-slate-700">Tên khách hàng<input v-model="tenKhachHang" required autocomplete="name" :class="inputClass" /></label>
        <label class="block text-sm font-bold text-slate-700">Số điện thoại<input v-model="soDienThoai" required type="tel" autocomplete="tel" :class="inputClass" /></label>
      </div>

      <label class="block text-sm font-bold text-slate-700">Phương thức thanh toán
        <select v-model="phuongThucThanhToan" :class="[inputClass, 'bg-white']">
          <option value="TIEN_MAT">Tiền mặt</option>
          <option value="CHUYEN_KHOAN">Chuyển khoản — xác nhận thủ công</option>
          <option value="VNPAY" disabled>VNPay tại quầy chưa được hỗ trợ</option>
        </select>
      </label>

      <button type="submit" :disabled="submitting || loadingSchedule || availableFields.length === 0" class="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">{{ submitting ? "Đang tạo đơn..." : "Tạo đơn tại quầy" }}</button>
    </form>
  </section>
</template>
