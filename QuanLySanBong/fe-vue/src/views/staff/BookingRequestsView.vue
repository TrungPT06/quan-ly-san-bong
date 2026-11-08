<script setup>
import { onMounted, ref } from "vue";
import BookingDetailModal from "../../components/BookingDetailModal.vue";
import { getResponseList, getStaffApiError, staffApi } from "../../api/staffApi";
import { exclusiveAction } from "../../utils/exclusiveAction";

const requests = ref([]);
const loading = ref(true);
const busyId = ref(null);
const error = ref("");
const message = ref("");
const detail = ref(null);
const rejectTarget = ref(null);
const reason = ref("");

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const customer = (b) => b.khachHang?.hoTen || b.tenKhachHang || b.hoTen || "Khách đặt sân";
const phone = (b) => b.khachHang?.soDienThoai || b.soDienThoai || b.sdt || "Chưa có";

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await staffApi.listBookingRequests();
    requests.value = getResponseList(data).filter((item) => item.trangThai === "CHO_XAC_NHAN");
  } catch (err) {
    error.value = getStaffApiError(err, "Không tải được yêu cầu đặt sân.");
  } finally {
    loading.value = false;
  }
}

const approve = exclusiveAction(async (booking) => {
  busyId.value = booking.id;
  error.value = "";
  message.value = "";
  try {
    await staffApi.approveBooking(booking.id);
    message.value = `Đã duyệt đơn #${booking.id}.`;
    await load();
  } catch (err) {
    error.value = getStaffApiError(err, "Không duyệt được đơn đặt sân.");
  } finally {
    busyId.value = null;
  }
});

const reject = exclusiveAction(async () => {
  if (!rejectTarget.value || !reason.value.trim()) return;
  const target = rejectTarget.value;
  busyId.value = target.id;
  error.value = "";
  message.value = "";
  try {
    await staffApi.rejectBooking(target.id, reason.value.trim());
    message.value = `Đã từ chối đơn #${target.id}.`;
    rejectTarget.value = null;
    reason.value = "";
    await load();
  } catch (err) {
    error.value = getStaffApiError(err, "Không từ chối được đơn đặt sân.");
  } finally {
    busyId.value = null;
  }
});

function askReject(booking) {
  rejectTarget.value = booking;
  reason.value = "";
}

onMounted(load);
</script>

<template>
  <section class="mx-auto w-full max-w-7xl p-4 sm:p-6">
    <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Nhân viên Trực Page</p>
        <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Yêu cầu đặt sân</h1>
        <p class="mt-1 text-sm text-slate-500">Các đơn đang chờ xác nhận.</p>
      </div>
      <button type="button" class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50" @click="load">Làm mới</button>
    </div>

    <p v-if="message" role="status" class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{{ message }}</p>
    <p v-if="error" role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }}</p>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div v-if="loading" class="p-10 text-center text-sm font-semibold text-slate-500">Đang tải yêu cầu...</div>
      <div v-else-if="requests.length === 0" class="p-10 text-center">
        <p class="text-base font-bold text-slate-800">Không có đơn chờ xác nhận</p>
        <p class="mt-1 text-sm text-slate-500">Đơn mới sẽ xuất hiện tại đây.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[850px] text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">Mã đơn</th><th class="px-4 py-3">Khách hàng</th><th class="px-4 py-3">Sân / giờ</th>
              <th class="px-4 py-3">Giá</th><th class="px-4 py-3">Trạng thái</th><th class="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="booking in requests" :key="booking.id" class="cursor-pointer transition hover:bg-slate-50" @click="detail = booking">
              <td class="px-4 py-3 font-extrabold text-slate-900">#{{ booking.id }}</td>
              <td class="px-4 py-3"><p class="font-bold text-slate-800">{{ customer(booking) }}</p><p class="mt-0.5 text-xs text-slate-500">{{ phone(booking) }}</p></td>
              <td class="px-4 py-3">
                <p class="font-bold text-slate-800">{{ booking.tenSan || booking.san?.tenSan || "Chưa cập nhật" }}</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ booking.ngayDat || "" }} · {{ booking.gioBatDau || "--:--" }} - {{ booking.gioKetThuc || "--:--" }}</p>
              </td>
              <td class="px-4 py-3 font-bold text-slate-800">{{ money(booking.gia) }}</td>
              <td class="px-4 py-3"><span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">CHO_XAC_NHAN</span></td>
              <td class="px-4 py-3" @click.stop>
                <div class="flex justify-end gap-2">
                  <button type="button" :disabled="busyId !== null" class="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50" @click="approve(booking)">{{ busyId === booking.id ? "Đang xử lý" : "Duyệt" }}</button>
                  <button type="button" :disabled="busyId !== null" class="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50" @click="askReject(booking)">Từ chối</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BookingDetailModal :booking="detail" @close="detail = null" />

    <div v-if="rejectTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form class="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl sm:p-6" @submit.prevent="reject">
        <h2 class="text-lg font-black text-slate-950">Từ chối đơn #{{ rejectTarget.id }}</h2>
        <label class="mt-4 block text-sm font-bold text-slate-700" for="reject-reason">Lý do từ chối</label>
        <textarea id="reject-reason" v-model="reason" required minlength="3" rows="4" class="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100" placeholder="Nhập lý do để thông báo cho khách" />
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" @click="rejectTarget = null">Hủy</button>
          <button type="submit" :disabled="busyId !== null" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">{{ busyId === rejectTarget.id ? "Đang gửi..." : "Xác nhận từ chối" }}</button>
        </div>
      </form>
    </div>
  </section>
</template>
