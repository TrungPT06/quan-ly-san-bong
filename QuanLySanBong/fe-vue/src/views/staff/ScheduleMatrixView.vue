<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import BookingDetailModal from "../../components/BookingDetailModal.vue";
import StaffScheduleMatrix from "../../components/StaffScheduleMatrix.vue";

const route = useRoute();
const detail = ref(null);
const subtitle = computed(() =>
  route.path.startsWith("/onsite")
    ? "Xem nhanh tình trạng sân trong ngày để phục vụ khách tại quầy."
    : "Theo dõi đơn và trạng thái sân theo ngày. Chọn ô đã có đơn để xem chi tiết.",
);
</script>

<template>
  <StaffScheduleMatrix
    title="Sơ đồ ma trận sân"
    :subtitle="subtitle"
    @select-booking="detail = $event"
  />
  <BookingDetailModal :booking="detail" @close="detail = null" />
</template>
