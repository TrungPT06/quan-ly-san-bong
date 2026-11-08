import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { authApi } from "../api/authApi";
import { vietnamDate } from "../api/dates";

const formatTime = (value) => {
  if (!value) return "";
  const raw = String(value);
  return raw.length > 5 ? raw.slice(0, 5) : raw;
};

function normalizeStatus(value) {
  const raw = String(value || "TRONG").trim().toUpperCase();
  if (raw === "TRONG" || raw === "AVAILABLE") return "TRONG";
  if (raw === "DA_DAT" || raw === "BOOKED") return "DA_DAT";
  if (raw === "KHONG_HOAT_DONG" || raw === "INACTIVE") return "KHONG_HOAT_DONG";
  return raw;
}

// Store "đơn đặt tạm": đóng vai trò giống giỏ hàng (Cart) của đề bài.
// Giữ sân + ngày + khung giờ đang chọn, tính tổng tiền và gửi đơn qua API.
export const useBookingStore = defineStore("booking", () => {
  // State
  const fieldId = ref(null);
  const ngayDat = ref(vietnamDate());
  const slots = ref([]);
  const selectedSlot = ref(null);
  const paymentMethod = ref("VNPAY");
  const loading = ref(false);
  const error = ref("");
  const submitting = ref(false);
  let requestId = 0;

  // Getters (computed)
  const total = computed(() => selectedSlot.value?.giaNumber ?? 0);
  const canSubmit = computed(() => selectedSlot.value?.trangThai === "TRONG" && !submitting.value);
  const availableCount = computed(() => slots.value.filter((slot) => slot.trangThai === "TRONG").length);

  // Actions
  function open(id) {
    fieldId.value = id;
    ngayDat.value = vietnamDate();
    selectedSlot.value = null;
    slots.value = [];
  }
  function setDate(value) {
    ngayDat.value = value;
    selectedSlot.value = null;
  }
  function selectSlot(slot) {
    if (slot.trangThai === "TRONG") selectedSlot.value = slot;
  }
  async function loadSlots() {
    if (!fieldId.value || !ngayDat.value) return;
    const current = ++requestId;
    loading.value = true;
    error.value = "";
    selectedSlot.value = null;
    try {
      const data = await authApi.layLichTrongSan(fieldId.value, ngayDat.value);
      if (current !== requestId) return; // bỏ qua kết quả của request cũ
      slots.value = Array.isArray(data)
        ? data.map((slot) => ({
            ...slot,
            gioBatDauDisplay: formatTime(slot?.gioBatDau),
            gioKetThucDisplay: formatTime(slot?.gioKetThuc),
            giaNumber: Number(slot?.gia ?? 0),
            trangThai: normalizeStatus(slot?.trangThai),
          }))
        : [];
    } catch (err) {
      if (current !== requestId) return;
      slots.value = [];
      error.value = err?.message || "Không thể tải khung giờ.";
    } finally {
      if (current === requestId) loading.value = false;
    }
  }
  // Tạo đơn đặt sân; nếu chọn VNPay thì lấy luôn link thanh toán.
  async function checkout() {
    if (!canSubmit.value) throw new Error("Vui lòng chọn một khung giờ còn trống.");
    submitting.value = true;
    try {
      const booking = await authApi.taoDatSan(fieldId.value, selectedSlot.value.khungGioId, ngayDat.value, paymentMethod.value);
      if (paymentMethod.value !== "VNPAY") return { booking };
      try {
        const pay = await authApi.taoLinkVNPay(booking.id);
        return { booking, paymentUrl: pay.paymentUrl };
      } catch (err) {
        return { booking, paymentError: err.message || "Không tạo được link thanh toán." };
      }
    } catch (err) {
      if (err.status === 409) {
        // Khung giờ vừa bị người khác đặt: hoàn trả lựa chọn và tải lại lịch
        selectedSlot.value = null;
        loadSlots();
      }
      throw err;
    } finally {
      submitting.value = false;
    }
  }

  return { fieldId, ngayDat, slots, selectedSlot, paymentMethod, loading, error, submitting, total, canSubmit, availableCount, open, setDate, selectSlot, loadSlots, checkout };
});
