<script setup>
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import CourtCard from "../components/CourtCard.vue";
import CourtSearchBar from "../components/CourtSearchBar.vue";
import { useAuthStore } from "../stores/auth";
import { useCourtsStore } from "../stores/courts";
import { useFavoritesStore } from "../stores/favorites";
import { asset } from "../utils/asset";
import "../assets/css/Homepage.css";

defineProps({ listing: { type: Boolean, default: false } });

const router = useRouter();
const auth = useAuthStore();
const courts = useCourtsStore();
const favorites = useFavoritesStore();

const heroImage = asset("assets/stadium-hero.png");
const heroStyle = { backgroundImage: `linear-gradient(90deg, rgba(11,15,20,.86), rgba(11,15,20,.14)), url(${heroImage})` };
const processStyle = { backgroundImage: `linear-gradient(rgba(11,15,20,.88),rgba(11,15,20,.88)), url(${heroImage})` };
const searchHint = "Chọn ngày và khung giờ tại chi tiết sân để kiểm tra lịch trống và giá chính xác.";
const steps = [
  ["01", "⌕", "Tìm sân phù hợp", "Chọn khu vực, loại sân và xem thông tin sân phù hợp với đội của bạn."],
  ["02", "▦", "Chọn ngày và khung giờ", "Xem lịch trống, chọn thời gian và kiểm tra giá trước khi đặt."],
  ["03", "✓", "Theo dõi yêu cầu đặt sân", "Đăng nhập, gửi yêu cầu và theo dõi xác nhận trong lịch sử đặt sân."],
];
const benefits = [
  ["⚽", "Thông tin sân rõ ràng", "Xem loại sân và cụm sân trước khi lựa chọn."],
  ["◷", "Đặt sân thuận tiện", "Chọn thời gian phù hợp từ lịch sân."],
  ["▦", "Quản lý lịch linh hoạt", "Theo dõi yêu cầu và hóa đơn trong tài khoản."],
  ["♡", "Sân quen luôn bên bạn", "Lưu sân yêu thích để quay lại dễ dàng."],
];

const isCustomer = computed(() => auth.role === "customer");

onMounted(() => courts.load());
// Chỉ khách hàng đã đăng nhập mới có danh sách yêu thích
watch(isCustomer, (value) => (value ? favorites.load() : favorites.clear()), { immediate: true });

function scrollToCourts() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("courts")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
function onFavorite(id) {
  if (isCustomer.value) favorites.toggle(id);
  else router.push({ name: "login", query: { redirect: router.currentRoute.value.fullPath } });
}
function reloadAll() {
  courts.resetFilters();
  courts.load();
}
</script>

<template>
  <div :class="['club-home', { 'club-directory': listing }]">
    <section :class="listing ? 'club-search-hero' : 'club-hero'" :style="heroStyle" aria-labelledby="home-heading">
      <div class="club-container">
        <p class="club-eyebrow">{{ listing ? "SÂN BÓNG PRO / TÌM SÂN" : "TRẢI NGHIỆM SÂN BÓNG ĐẲNG CẤP" }}</p>
        <h1 v-if="listing" id="home-heading">Tìm sân bóng<span>.</span></h1>
        <h1 v-else id="home-heading">TÌM SÂN.<br /><span>ĐẶT GIỜ.</span></h1>
        <p class="club-hero-description">
          <template v-if="listing">Khám phá sân phù hợp cho trận đấu tiếp theo của bạn.</template>
          <template v-else>Nền tảng đặt sân bóng hiện đại, nhanh chóng và tiện lợi.<br />Cho những trận cầu đỉnh cao của bạn.</template>
        </p>
        <button v-if="!listing" type="button" class="club-button club-hero-cta" @click="scrollToCourts">Đặt sân ngay <span aria-hidden="true">→</span></button>
        <template v-if="listing">
          <CourtSearchBar @search="scrollToCourts" />
          <p class="club-search-hint">{{ searchHint }}</p>
        </template>
        <div v-else class="club-hero-image-space" aria-hidden="true"><div /><p class="club-search-hint">{{ searchHint }}</p></div>
        <div v-if="!listing" class="club-trust-strip">
          <span>◷ Đặt sân thuận tiện</span><span>⚽ Tìm sân phù hợp</span><span>▦ Quản lý lịch rõ ràng</span><span>♡ Lưu sân yêu thích</span>
        </div>
      </div>
    </section>

    <div :class="listing ? '' : 'club-discovery'">
      <section id="courts" class="club-container club-courts" aria-label="Danh sách sân bóng">
        <template v-if="!listing">
          <CourtSearchBar @search="scrollToCourts" />
          <p class="club-search-hint">{{ searchHint }}</p>
        </template>
        <div :class="listing ? 'club-section-heading' : 'club-sort-row'">
          <div v-if="listing">
            <p class="club-eyebrow">DANH SÁCH SÂN ĐANG HOẠT ĐỘNG</p>
            <h2>Sân bóng dành cho bạn</h2>
            <p>Danh sách từ hệ thống. Lịch trống được kiểm tra khi bạn chọn ngày.</p>
          </div>
          <label class="club-sort">Sắp xếp
            <select v-model="courts.filters.sort">
              <option value="name">Tên A–Z</option>
              <option value="price-asc">Giá thấp trước</option>
              <option value="price-desc">Giá cao trước</option>
            </select>
          </label>
        </div>

        <div v-if="favorites.error" role="alert" class="club-alert">{{ favorites.error }}<button type="button" @click="favorites.load()">Thử tải lại</button></div>

        <div v-if="courts.loading" class="court-grid" role="status" aria-label="Đang tải danh sách sân">
          <div v-for="item in 4" :key="item" class="court-skeleton"><div /><span /><span /></div>
          <span class="sr-only">Đang tải danh sách sân…</span>
        </div>
        <div v-else-if="courts.error" role="alert" class="club-empty">
          <span aria-hidden="true">!</span><h3>Chưa thể tải danh sách sân</h3><p>{{ courts.error }}</p>
          <button class="club-button" @click="courts.load()">Thử lại</button>
        </div>
        <div v-else-if="!courts.filtered.length" class="club-empty">
          <span aria-hidden="true">⌕</span>
          <h3>{{ courts.courts.length ? "Chưa tìm thấy sân phù hợp" : "Danh sách sân đang được cập nhật" }}</h3>
          <p>Thử thay đổi tên sân, khu vực hoặc loại sân.</p>
          <button class="club-button" @click="reloadAll">Tải lại danh sách</button>
        </div>
        <template v-else>
          <p class="club-results" role="status">Tìm thấy <strong>{{ courts.filtered.length }}</strong> sân bóng</p>
          <div class="court-grid">
            <CourtCard
              v-for="court in courts.filtered"
              :key="court.id"
              :court="court"
              :saved="favorites.ids.has(court.id)"
              :busy="favorites.busy.has(court.id)"
              @favorite="onFavorite(court.id)"
            />
          </div>
        </template>
      </section>
    </div>

    <template v-if="!listing">
      <section id="how-it-works" class="club-process" :style="processStyle">
        <div class="club-container">
          <div class="club-section-heading">
            <div><h2>QUY TRÌNH <span>ĐẶT SÂN</span> ĐƠN GIẢN</h2><p>Chỉ với 3 bước, bạn đã có thể chuẩn bị cho trận đấu.</p></div>
          </div>
          <div class="club-steps">
            <article v-for="[number, icon, title, text] in steps" :key="number">
              <b>{{ number }}</b><span aria-hidden="true">{{ icon }}</span><h3>{{ title }}</h3><p>{{ text }}</p>
            </article>
          </div>
        </div>
      </section>
      <section id="about" class="club-container club-about">
        <div>
          <p class="club-eyebrow">VỀ SÂN BÓNG PRO</p>
          <h2>VÌ SAO CHỌN <span>SÂN BÓNG PRO</span></h2>
          <p>Một nơi để tìm sân, quản lý lịch đặt và lưu những sân bạn yêu thích.</p>
        </div>
        <div class="club-benefits">
          <article v-for="[icon, title, text] in benefits" :key="title">
            <span aria-hidden="true">{{ icon }}</span><div><h3>{{ title }}</h3><p>{{ text }}</p></div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
