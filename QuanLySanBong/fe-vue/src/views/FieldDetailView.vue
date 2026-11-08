<script setup>
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import FieldPresentation from "../components/FieldPresentation.vue";
import { useAuthStore } from "../stores/auth";
import { useBookingStore } from "../stores/booking";
import { vietnamDate } from "../api/dates";
import { exclusiveAction } from "../utils/exclusiveAction";
import "../assets/css/Homepage.css";
import "../assets/css/BookingPage.css";

const props = defineProps({ fieldId: { type: Number, required: true } });

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const cart = useBookingStore();

const today = vietnamDate();
const paymentOptions = [
  { value: "VNPAY", label: "Thanh toán VNPay", detail: "Thanh toán trực tuyến an toàn" },
  { value: "TIEN_MAT", label: "Tiền mặt tại sân", detail: "Thanh toán trực tiếp khi đến sân" },
];
const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;
const slotState = (slot) => {
  if (slot.trangThai === "DA_DAT") return { cls: "is-booked", label: "Đã đặt", canChoose: false };
  if (slot.trangThai === "KHONG_HOAT_DONG") return { cls: "is-inactive", label: "Không hoạt động", canChoose: false };
  const selected = cart.selectedSlot?.khungGioId === slot.khungGioId;
  return { cls: selected ? "is-selected" : "is-available", label: selected ? "Đang chọn" : "Còn trống", canChoose: slot.trangThai === "TRONG", selected };
};

// Đổi sân -> đặt lại đơn tạm; đổi sân hoặc ngày -> tải lại khung giờ
watch(() => props.fieldId, (id) => cart.open(id), { immediate: true });
watch(() => [cart.fieldId, cart.ngayDat], () => cart.loadSlots(), { immediate: true });

const submit = exclusiveAction(async () => {
  if (cart.submitting) return;
  if (!auth.isLoggedIn) {
    alert("Bạn cần đăng nhập để thực hiện đặt sân!");
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }
  if (!cart.canSubmit) {
    alert("Vui lòng chọn một khung giờ còn trống.");
    return;
  }
  try {
    const { booking, paymentUrl, paymentError } = await cart.checkout();
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else if (paymentError) {
      alert(`Đơn #${booking.id} đã được tạo. ${paymentError} Vui lòng tiếp tục thanh toán từ lịch sử đặt sân.`);
      router.push("/lich-su-dat-san");
    } else {
      alert(`Đã gửi yêu cầu đặt sân #${booking.id}. Nhân viên sẽ xác nhận thanh toán tại sân.`);
      router.push("/lich-su-dat-san");
    }
  } catch (err) {
    alert(err?.message || "Đặt sân thất bại!");
  }
});
</script>

<template>
  <div class="booking-page">
    <div class="booking-shell">
      <FieldPresentation :field-id="fieldId" />
      <RouterLink to="/" class="booking-back-link"><span aria-hidden="true">←</span> Quay lại danh sách sân</RouterLink>

      <header class="booking-heading">
        <div>
          <p class="booking-eyebrow">ĐẶT SÂN TRỰC TUYẾN</p>
          <h2>Lịch trống và đặt sân</h2>
          <p class="booking-intro">Chọn ngày thi đấu, khung giờ phù hợp và phương thức thanh toán.</p>
        </div>
        <div class="booking-stepper" aria-label="Các bước đặt sân">
          <span class="booking-step is-current"><b>01</b> Chọn ngày</span>
          <span class="booking-step-divider" aria-hidden="true" />
          <span :class="['booking-step', { 'is-current': cart.selectedSlot }]"><b>02</b> Chọn khung giờ</span>
          <span class="booking-step-divider" aria-hidden="true" />
          <span :class="['booking-step', { 'is-current': cart.selectedSlot }]"><b>03</b> Xác nhận</span>
        </div>
      </header>

      <div class="booking-layout">
        <section class="booking-schedule">
          <div class="booking-panel">
            <div class="booking-panel-heading">
              <span class="booking-panel-icon" aria-hidden="true">01</span>
              <div><h2>Chọn ngày thi đấu</h2><p>Lịch trống được cập nhật theo ngày bạn chọn.</p></div>
            </div>
            <label class="booking-date-field">
              <span>Ngày đặt sân</span>
              <input type="date" :min="today" :value="cart.ngayDat" aria-label="Chọn ngày đá" @input="cart.setDate($event.target.value)" />
            </label>
          </div>

          <div class="booking-panel booking-availability-panel">
            <div class="booking-availability-heading">
              <div class="booking-panel-heading">
                <span class="booking-panel-icon" aria-hidden="true">02</span>
                <div><h2>Chọn khung giờ</h2><p>Chọn một khung giờ còn trống để tiếp tục.</p></div>
              </div>
              <div class="booking-legend" aria-label="Chú thích trạng thái">
                <span><i class="is-available" /> Còn trống</span>
                <span><i class="is-selected" /> Đang chọn</span>
                <span><i class="is-booked" /> Đã đặt</span>
                <span><i class="is-inactive" /> Không hoạt động</span>
              </div>
            </div>

            <div v-if="!cart.ngayDat" class="booking-empty-state"><span aria-hidden="true">◷</span><p>Vui lòng chọn ngày để xem khung giờ.</p></div>
            <div v-else-if="cart.loading" class="booking-empty-state"><span class="booking-spinner" aria-hidden="true" /><p>Đang tải khung giờ...</p></div>
            <div v-else-if="cart.error" class="booking-error-state"><p>{{ cart.error }}</p><button type="button" @click="cart.loadSlots()">Thử lại</button></div>
            <div v-else-if="cart.slots.length === 0" class="booking-empty-state"><span aria-hidden="true">◷</span><p>Không có khung giờ trống trong ngày này.</p></div>
            <div v-else class="booking-slots">
              <button
                v-for="slot in cart.slots"
                :key="slot.khungGioId"
                type="button"
                :disabled="!slotState(slot).canChoose"
                :aria-pressed="Boolean(slotState(slot).selected)"
                :class="['booking-slot', slotState(slot).cls]"
                @click="cart.selectSlot(slot)"
              >
                <span class="booking-slot-status">{{ slotState(slot).label }}</span>
                <span v-if="slotState(slot).canChoose" class="booking-slot-mark" aria-hidden="true">{{ slotState(slot).selected ? "✓" : "+" }}</span>
                <strong>{{ slot.gioBatDauDisplay || "--:--" }} – {{ slot.gioKetThucDisplay || "--:--" }}</strong>
                <span class="booking-slot-price">{{ money(slot.giaNumber) }}</span>
              </button>
            </div>
          </div>
        </section>

        <aside class="booking-checkout">
          <div class="booking-panel booking-payment-panel">
            <div class="booking-panel-heading">
              <span class="booking-panel-icon" aria-hidden="true">03</span>
              <div><h2>Thanh toán</h2><p>Chọn cách thanh toán thuận tiện.</p></div>
            </div>
            <fieldset class="booking-payment-options">
              <legend class="sr-only">Phương thức thanh toán</legend>
              <label v-for="option in paymentOptions" :key="option.value" :class="['booking-payment-option', { 'is-active': cart.paymentMethod === option.value }]">
                <input v-model="cart.paymentMethod" type="radio" name="phuongThucThanhToan" :value="option.value" />
                <span class="booking-radio-indicator" aria-hidden="true" />
                <span class="booking-payment-copy"><strong>{{ option.label }}</strong><small>{{ option.detail }}</small></span>
              </label>
            </fieldset>

            <div class="booking-order-summary">
              <p class="booking-order-summary-title">Tóm tắt đặt sân</p>
              <div><span>Ngày thi đấu</span><strong>{{ cart.ngayDat || "Chưa chọn ngày" }}</strong></div>
              <div>
                <span>Khung giờ</span>
                <strong>{{ cart.selectedSlot ? `${cart.selectedSlot.gioBatDauDisplay || "--:--"} – ${cart.selectedSlot.gioKetThucDisplay || "--:--"}` : "Chưa chọn" }}</strong>
              </div>
              <div class="booking-order-total"><span>Tổng thanh toán</span><strong>{{ cart.selectedSlot ? money(cart.total) : "—" }}</strong></div>
            </div>

            <button type="button" :disabled="!cart.canSubmit" class="booking-submit" @click="submit">
              {{ cart.submitting ? "Đang tạo đơn..." : cart.canSubmit ? `Thanh toán (${money(cart.total)})` : "Vui lòng chọn khung giờ trống" }}
            </button>
            <p class="booking-secure-note"><span aria-hidden="true">✓</span> Thông tin đặt sân được bảo mật.</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
