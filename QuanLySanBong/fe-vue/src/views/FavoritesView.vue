<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import CourtCard from "../components/CourtCard.vue";
import { favoriteApi } from "../api/favoriteApi";
import { useAuthStore } from "../stores/auth";
import { exclusiveAction } from "../utils/exclusiveAction";
import "../assets/css/Homepage.css";

const router = useRouter();
const auth = useAuthStore();

const fields = ref([]);
const loading = ref(true);
const error = ref("");
const busyId = ref(null);

async function load() {
  if (!auth.isLoggedIn) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const data = await favoriteApi.list();
    if (!Array.isArray(data)) throw new Error("API trả danh sách yêu thích không hợp lệ.");
    fields.value = data;
  } catch (err) {
    error.value = err.message || "Không tải được danh sách sân yêu thích.";
  } finally {
    loading.value = false;
  }
}

const remove = exclusiveAction(async (fieldId) => {
  busyId.value = fieldId;
  error.value = "";
  try {
    await favoriteApi.remove(fieldId);
    fields.value = fields.value.filter((field) => field.id !== fieldId);
  } catch (err) {
    error.value = err.message || "Không thể bỏ yêu thích.";
  } finally {
    busyId.value = null;
  }
});

onMounted(load);
</script>

<template>
  <section class="club-container club-favorites">
    <div class="club-section-heading">
      <div>
        <p class="club-eyebrow">SÂN QUEN CHO MỖI TRẬN ĐẤU</p>
        <h1>Sân yêu thích<span>.</span></h1>
        <p>Các sân bạn đã lưu trong tài khoản.</p>
      </div>
      <button v-if="auth.isLoggedIn" class="club-button club-button-outline" :disabled="loading" @click="load">Làm mới</button>
    </div>
    <p v-if="error" role="alert" class="club-alert">{{ error }} <button @click="load">Thử lại</button></p>

    <div v-if="!auth.isLoggedIn" class="club-empty">
      <span aria-hidden="true">♡</span><h2>Lưu những sân bạn yêu thích</h2>
      <p>Đăng nhập để xem và quản lý danh sách sân yêu thích của bạn.</p>
      <button class="club-button" @click="router.push({ name: 'login', query: { redirect: '/yeu-thich' } })">Đăng nhập</button>
    </div>
    <div v-else-if="loading" role="status" class="court-grid">
      <div v-for="key in 3" :key="key" class="court-skeleton"><div /><span /><span /></div>
      <span class="sr-only">Đang tải sân yêu thích…</span>
    </div>
    <div v-else-if="!fields.length && !error" class="club-empty">
      <span aria-hidden="true">♡</span><h2>Bạn chưa có sân yêu thích</h2>
      <p>Chọn biểu tượng trái tim trên sân để lưu vào tài khoản.</p>
      <button class="club-button" @click="router.push('/tim-san')">Khám phá sân bóng</button>
    </div>
    <div v-else class="court-grid">
      <CourtCard v-for="court in fields" :key="court.id" :court="court" saved :busy="busyId !== null" @favorite="remove(court.id)" />
    </div>
  </section>
</template>
