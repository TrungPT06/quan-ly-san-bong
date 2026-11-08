<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useCourtsStore } from "../stores/courts";
import { useFavoritesStore } from "../stores/favorites";
import { fieldImageUrl } from "../utils/fieldImage";

const props = defineProps({ fieldId: { type: Number, required: true } });

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const courts = useCourtsStore();
const favorites = useFavoritesStore();

const failedImage = ref(false);
const notFound = ref(false);

const field = computed(() => courts.courts.find((item) => Number(item.id) === props.fieldId) || null);
const saved = computed(() => favorites.ids.has(props.fieldId));
const isCustomer = computed(() => auth.role === "customer");
const error = computed(() => courts.error || favorites.error || (notFound.value ? "Không tìm thấy sân đang hoạt động." : ""));
const imageUrl = computed(() => fieldImageUrl(field.value?.hinhAnh));

async function load() {
  failedImage.value = false;
  notFound.value = false;
  if (!courts.courts.length) await courts.load();
  notFound.value = !field.value && !courts.error;
}

watch(() => props.fieldId, load, { immediate: true });
watch(isCustomer, (value) => (value ? favorites.load() : favorites.clear()), { immediate: true });

function toggle() {
  if (!isCustomer.value) return router.push({ name: "login", query: { redirect: route.fullPath } });
  return favorites.toggle(props.fieldId);
}
</script>

<template>
  <section class="field-presentation">
    <p v-if="error" role="alert" class="club-alert">{{ error }} <button type="button" @click="load">Thử lại</button></p>

    <template v-if="field">
      <div class="field-presentation-image">
        <img v-if="imageUrl && !failedImage" :src="imageUrl" :alt="field.tenSan || 'Sân bóng'" @error="failedImage = true" />
        <div v-else class="court-photo-empty">Ảnh sân đang được cập nhật</div>
      </div>
      <div class="field-presentation-info">
        <p class="club-eyebrow">{{ field.tenCumSan || "THÔNG TIN SÂN" }}</p>
        <h1>{{ field.tenSan }}</h1>
        <p>{{ field.loaiSan }}</p>
        <p>{{ field.moTa }}</p>
        <button type="button" class="club-button club-button-outline" :disabled="favorites.busy.has(fieldId)" :aria-pressed="saved" @click="toggle">
          {{ saved ? "♥ Bỏ yêu thích" : "♡ Yêu thích sân" }}
        </button>
      </div>
    </template>
    <p v-else-if="!error" role="status">Đang tải thông tin sân…</p>
  </section>
</template>
