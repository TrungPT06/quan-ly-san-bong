<script setup>
import { ref, watch } from "vue";
import { adminApi } from "../../api/adminApi";
import { errorMessage } from "../../composables/useApiError";
import { methodLabel, paymentLabel } from "../../utils/statusLabels";
import { exclusiveAction } from "../../utils/exclusiveAction";

const status = ref("CHO_THANH_TOAN");
const payments = ref([]);
const loading = ref(true);
const busyId = ref(null);
const error = ref("");
const message = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    payments.value = (await adminApi.getPayments(status.value)).data || [];
  } catch (err) {
    error.value = errorMessage(err, "Không tải được danh sách giao dịch.");
  } finally {
    loading.value = false;
  }
}
watch(status, load, { immediate: true });

const confirmPayment = exclusiveAction(async (payment) => {
  busyId.value = payment.id;
  error.value = "";
  try {
    await adminApi.confirmPayment(payment.id);
    message.value = `Đã xác nhận giao dịch cho đơn #${payment.datSanId}.`;
    await load();
  } catch (err) {
    error.value = errorMessage(err, "Không thể xác nhận giao dịch.");
  } finally {
    busyId.value = null;
  }
});
</script>

<template>
  <section class="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
    <header>
      <p class="text-xs font-black uppercase tracking-[0.18em] text-red-700">Đối soát</p>
      <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Giao dịch thanh toán</h1>
    </header>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>
    <p v-if="message" role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{{ message }}</p>

    <div class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <label class="text-xs font-bold uppercase text-slate-500" for="payment-status">Trạng thái</label>
      <select id="payment-status" v-model="status" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">
        <option value="CHO_THANH_TOAN">Chờ thanh toán</option><option value="THANH_CONG">Thành công</option><option value="THAT_BAI">Thất bại</option>
      </select>
      <button type="button" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" @click="load">Làm mới</button>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <p v-if="loading" class="p-10 text-center text-sm font-semibold text-slate-500">Đang tải giao dịch...</p>
      <p v-else-if="payments.length === 0" class="p-10 text-center text-sm font-semibold text-slate-500">Không có giao dịch ở trạng thái này.</p>
      <table v-else class="w-full min-w-[850px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th class="p-3">Mã GD</th><th class="p-3">Đơn / Khách</th><th class="p-3">Sân / Ngày</th><th class="p-3">Phương thức</th><th class="p-3">Số tiền</th><th class="p-3">Trạng thái</th><th class="p-3 text-right">Thao tác</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="payment in payments" :key="payment.id">
            <td class="p-3 font-bold">#{{ payment.id }}</td>
            <td class="p-3"><span class="font-bold">Đơn #{{ payment.datSanId }}</span><br /><span class="text-xs text-slate-500">{{ payment.tenKhachHang }} · {{ payment.soDienThoai }}</span></td>
            <td class="p-3">{{ payment.tenSan }}<br /><span class="text-xs text-slate-500">{{ payment.ngayDat }}</span></td>
            <td class="p-3">{{ methodLabel(payment.phuongThuc) }}</td>
            <td class="p-3 font-bold">{{ Number(payment.soTien || 0).toLocaleString("vi-VN") }} đ</td>
            <td class="p-3">{{ paymentLabel(payment.trangThai) }}</td>
            <td class="p-3 text-right">
              <button v-if="payment.trangThai === 'CHO_THANH_TOAN' && payment.phuongThuc !== 'VNPAY'" type="button" :disabled="busyId !== null" class="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50" @click="confirmPayment(payment)">{{ busyId === payment.id ? "Đang lưu..." : "Xác nhận đã thu" }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
