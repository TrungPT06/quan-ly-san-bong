<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { http } from "../api/http";
import { useAuthStore } from "../stores/auth";

const labels = {
  SUCCESS: "Thanh toán thành công",
  FAILED: "Thanh toán thất bại hoặc đã hủy tại VNPay",
  CANCELLED: "Đơn đặt sân đã hủy",
  VERIFYING: "Đang xác minh thanh toán",
  REFUND_REVIEW: "Giao dịch cần kiểm tra hoàn tiền",
};

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const result = ref(null);
const error = ref("");
const reference = computed(() => route.query.ref);
let cancelled = false;
let timer;
let attempts = 0;

const title = computed(() => labels[result.value?.status] || labels.VERIFYING);
const message = computed(() => {
  if (!reference.value) return "Thiếu mã tham chiếu. Hãy kiểm tra lịch sử đặt sân.";
  if (!auth.isLoggedIn) return "Vui lòng đăng nhập để xem trạng thái đã xác thực của đơn.";
  if (error.value) return error.value;
  if (result.value?.status === "VERIFYING") return "Hệ thống đang chờ xác nhận từ VNPay. Bạn có thể kiểm tra lại trong lịch sử đặt sân.";
  return "Kết quả được lấy từ Backend, không dựa vào tham số trên trình duyệt.";
});

async function load() {
  try {
    const response = await http.get(`/api/thanh-toan/vnpay/status/${encodeURIComponent(reference.value)}`);
    if (cancelled) return;
    result.value = response.data;
    error.value = "";
    // Đang xác minh: hỏi lại mỗi 3 giây, tối đa 20 lần
    if (response.data.status === "VERIFYING" && ++attempts < 20) timer = setTimeout(load, 3000);
  } catch (err) {
    if (!cancelled) error.value = err.message || "Chưa lấy được trạng thái thanh toán. Vui lòng kiểm tra lịch sử.";
  }
}

onMounted(() => {
  if (reference.value && auth.isLoggedIn) load();
});
onBeforeUnmount(() => {
  cancelled = true;
  clearTimeout(timer);
});
</script>

<template>
  <section class="rounded-2xl bg-white p-6 shadow-sm mx-auto my-8 max-w-xl" aria-live="polite">
    <h1 class="text-2xl font-bold">{{ title }}</h1>
    <p class="my-4">{{ message }}</p>
    <p v-if="result" class="mb-4">Đơn #{{ result.bookingId }} · {{ Number(result.amount).toLocaleString("vi-VN") }} đ</p>
    <button class="club-button" @click="router.push(auth.isLoggedIn ? '/lich-su-dat-san' : '/dang-nhap')">
      {{ auth.isLoggedIn ? "Xem lịch sử đặt sân" : "Đăng nhập" }}
    </button>
  </section>
</template>
