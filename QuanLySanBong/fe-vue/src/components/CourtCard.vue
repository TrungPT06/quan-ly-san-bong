<script setup>
import { computed, ref } from "vue";
import { fieldImageUrl } from "../utils/fieldImage";

const props = defineProps({
  court: { type: Object, required: true },
  saved: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(["favorite"]);

const failed = ref(false);
const hasPrice = computed(() => props.court.giaThapNhat != null && Number.isFinite(Number(props.court.giaThapNhat)));
const price = computed(() => Number(props.court.giaThapNhat).toLocaleString("vi-VN"));
</script>

<template>
  <article class="court-card">
    <div class="court-card-image">
      <img v-if="court.hinhAnh && !failed" :src="fieldImageUrl(court.hinhAnh)" :alt="court.tenSan" loading="lazy" decoding="async" @error="failed = true" />
      <div v-else class="court-photo-empty"><span aria-hidden="true">▥</span><small>Ảnh sân đang được cập nhật</small></div>
      <button
        type="button"
        :class="['court-heart', { saved }]"
        :disabled="busy"
        :aria-pressed="saved"
        :aria-label="`${saved ? 'Bỏ yêu thích' : 'Yêu thích'} ${court.tenSan}`"
        @click="emit('favorite')"
      >{{ busy ? "…" : saved ? "♥" : "♡" }}</button>
      <span v-if="court.trangThai === 'HOAT_DONG'" class="court-status"><i />Đang hoạt động</span>
      <span v-else-if="court.trangThai === 'TAM_NGUNG'" class="court-status inactive">Tạm ngưng</span>
    </div>
    <div class="court-card-body">
      <h3>{{ court.tenSan }}</h3>
      <p class="court-location"><span aria-hidden="true">⌖</span>{{ court.tenCumSan || "Chưa cập nhật cụm sân" }}</p>
      <div class="court-meta"><span>⚽ {{ court.loaiSan || "Chưa cập nhật loại sân" }}</span></div>
      <div class="court-card-bottom">
        <div>
          <template v-if="hasPrice"><small>Giá từ</small><strong>{{ price }}<small>đ / giờ</small></strong></template>
          <small v-else>Chưa cấu hình giá</small>
        </div>
        <RouterLink class="club-button" :to="{ name: 'field-detail', params: { id: court.id } }">Xem chi tiết <span aria-hidden="true">→</span></RouterLink>
      </div>
    </div>
  </article>
</template>
