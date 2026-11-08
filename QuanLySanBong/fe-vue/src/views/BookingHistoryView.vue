<script setup>
import { onMounted, ref } from "vue";
import DialogShell from "../components/DialogShell.vue";
import { authApi } from "../api/authApi";
import { bookingLabel, methodLabel, paymentLabel } from "../utils/statusLabels";
import { exclusiveAction } from "../utils/exclusiveAction";
import "../assets/css/Homepage.css";
import "../assets/css/BookingPage.css";

const list = ref([]);
const loading = ref(true);
const error = ref("");
const invoice = ref(null);
const invoiceLoading = ref(false);

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const badgeClass = (status) => (["HOAN_THANH", "DA_XAC_NHAN", "DA_CHECKIN"].includes(status) ? "success" : status === "GIU_CHO_TAM" ? "warning" : "error");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    list.value = await authApi.layLichSuDatSan();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

const cancel = exclusiveAction(async (id) => {
  if (!window.confirm("Bạn có chắc chắn muốn hủy đơn đặt sân này?")) return;
  try {
    await authApi.huyDatSan(id);
    alert("Hủy đơn đặt sân thành công!");
    load();
  } catch (err) {
    alert(err.message || "Hủy thất bại");
  }
});

const continuePayment = exclusiveAction(async (id) => {
  try {
    const response = await authApi.taoLinkVNPay(id);
    window.location.href = response.paymentUrl;
  } catch (err) {
    error.value = err.message || "Không thể tiếp tục thanh toán.";
  }
});

async function showInvoice(id) {
  invoiceLoading.value = true;
  try {
    invoice.value = await authApi.layHoaDon(id);
  } catch (err) {
    error.value = err.message || "Không tải được hóa đơn.";
  } finally {
    invoiceLoading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="mx-auto my-8 max-w-6xl p-4 sm:p-6">
    <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.2em] text-[#DA1A32]">Customer account</p>
        <h2 class="mt-1 text-3xl font-black tracking-[-0.04em] text-[#0B0F14]">Lịch sử đặt sân</h2>
      </div>
      <button type="button" class="w-fit rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-bold text-[#0B0F14] shadow-sm hover:bg-[#f1faf4]" @click="load">Làm mới</button>
    </div>

    <div v-if="loading" class="rounded-[12px] border border-[#E5E7EB] bg-white p-10 text-center text-sm font-semibold text-[#64748B]">Đang tải lịch sử đặt sân...</div>
    <div v-else-if="error" class="rounded-[12px] border border-red-200 bg-red-50 p-10 text-center text-sm font-semibold text-red-700">{{ error }}</div>
    <div v-else-if="list.length === 0" class="rounded-[12px] border border-dashed border-[#CBD5E1] bg-white p-12 text-center">
      <p class="text-lg font-black text-[#0B0F14]">Bạn chưa có phiếu đặt sân nào.</p>
    </div>
    <div v-else class="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_12px_28px_rgba(7,26,23,0.04)]">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-[#f4faf7] text-[#64748B]">
            <tr>
              <th v-for="head in ['Mã đơn', 'Sân bóng', 'Ngày đá', 'Khung giờ', 'Giá tiền', 'Trạng thái', 'Thanh toán']" :key="head" class="p-3 font-black uppercase tracking-[0.12em]">{{ head }}</th>
              <th class="p-3 text-right font-black uppercase tracking-[0.12em]">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E5E7EB]">
            <tr v-for="item in list" :key="item.id" class="hover:bg-[#F8F9FB]">
              <td class="p-3 font-semibold text-[#0B0F14]">#{{ item.id }}</td>
              <td class="p-3 font-black text-[#B51228]">{{ item.tenSan }}</td>
              <td class="p-3 text-[#64748B]">{{ item.ngayDat }}</td>
              <td class="p-3 font-medium text-[#0B0F14]">{{ item.gioBatDau }} - {{ item.gioKetThuc }}</td>
              <td class="p-3 font-bold text-[#0B0F14]">{{ money(item.gia) }}</td>
              <td class="p-3"><span :class="['status-badge', badgeClass(item.trangThai)]">{{ bookingLabel(item.trangThai) }}</span></td>
              <td class="p-3">{{ item.canXuLyHoanTien ? "Cần kiểm tra hoàn tiền" : item.trangThaiThanhToan ? paymentLabel(item.trangThaiThanhToan) : "Chưa có giao dịch" }}</td>
              <td class="p-3 text-right">
                <div class="flex justify-end gap-2">
                  <button v-if="item.trangThai === 'GIU_CHO_TAM'" class="rounded-lg bg-[#DA1A32] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#B51228]" @click="continuePayment(item.id)">Tiếp tục thanh toán</button>
                  <button v-if="item.trangThai !== 'DA_HUY' && item.trangThai !== 'GIU_CHO_TAM'" :disabled="invoiceLoading" class="rounded-lg border border-[#FFF0F2] bg-[#FFF0F2] px-3 py-1.5 text-xs font-bold text-[#B51228]" @click="showInvoice(item.id)">Hóa đơn</button>
                  <button v-if="!['DA_HUY', 'HOAN_THANH', 'DA_CHECKIN'].includes(item.trangThai)" class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100" @click="cancel(item.id)">Hủy đơn</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DialogShell v-if="invoice" label="Hóa đơn đặt sân" @close="invoice = null">
      <section class="w-full max-w-lg rounded-[12px] bg-white p-5 shadow-2xl" aria-labelledby="invoice-title">
        <div class="flex items-start justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.2em] text-[#DA1A32]">Biên nhận đặt sân</p>
            <h2 id="invoice-title" class="mt-1 text-xl font-black text-[#0B0F14]">{{ invoice.maHoaDon }}</h2>
          </div>
          <button type="button" aria-label="Đóng hóa đơn" class="text-xl font-bold text-[#64748B]" @click="invoice = null">×</button>
        </div>
        <dl class="mt-3 divide-y divide-[#E5E7EB] text-sm">
          <div v-for="[label, value] in [['Khách hàng', invoice.tenKhachHang], ['Sân', invoice.tenSan], ['Ngày', invoice.ngayDat], ['Khung giờ', `${invoice.gioBatDau} – ${invoice.gioKetThuc}`], ['Tổng tiền', money(invoice.gia)], ['Trạng thái', bookingLabel(invoice.trangThaiDatSan)]]" :key="label" class="flex justify-between gap-4 py-2.5">
            <dt class="text-[#64748B]">{{ label }}</dt>
            <dd class="text-right font-bold text-[#0B0F14]">{{ value }}</dd>
          </div>
        </dl>
        <div class="mt-4 border-t border-[#E5E7EB] pt-3">
          <p class="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#64748B]">Giao dịch</p>
          <template v-if="invoice.giaoDich?.length">
            <div v-for="payment in invoice.giaoDich" :key="payment.id" class="flex justify-between py-1.5 text-xs">
              <span>{{ methodLabel(payment.phuongThuc) }} · {{ paymentLabel(payment.trangThai) }}</span>
              <span class="font-bold text-[#0B0F14]">{{ money(payment.soTien) }}</span>
            </div>
          </template>
          <p v-else class="text-sm text-[#64748B]">Chưa có giao dịch.</p>
        </div>
      </section>
    </DialogShell>
  </div>
</template>
