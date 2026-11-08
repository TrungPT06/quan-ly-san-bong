<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Brand from "../components/Brand.vue";
import { PUBLIC_NAV } from "../components/navigationConfig";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const open = ref(false);
const trigger = ref(null);
const account = ref(null);
const drawer = ref(null);

const userName = computed(() => (auth.isLoggedIn ? auth.displayName : ""));
// Khách hàng đã đăng nhập có thêm mục "Lịch sử đặt sân"
const navItems = computed(() =>
  userName.value
    ? [...PUBLIC_NAV.slice(0, 4), { label: "Lịch sử đặt sân", to: "/lich-su-dat-san" }, ...PUBLIC_NAV.slice(4)]
    : PUBLIC_NAV,
);
const isActive = (item) => {
  const current = route.path + route.hash;
  return item.to === "/" ? current === "/" : current === item.to || (!item.to.includes("#") && route.path === item.to);
};

function go(to) {
  open.value = false;
  account.value?.removeAttribute("open");
  router.push(to);
}
function logout() {
  account.value?.removeAttribute("open");
  auth.logout();
  router.push("/");
}

function onKey(event) {
  if (event.key === "Escape") {
    open.value = false;
    trigger.value?.focus();
  }
  if (event.key === "Tab" && drawer.value) {
    const items = [...drawer.value.querySelectorAll("a, button")];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
watch(open, async (value) => {
  if (value) {
    await nextTick();
    drawer.value?.querySelector("a, button")?.focus();
    document.addEventListener("keydown", onKey);
  } else {
    document.removeEventListener("keydown", onKey);
  }
});
watch(() => route.fullPath, () => { open.value = false; });
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
const year = new Date().getFullYear();
</script>

<template>
  <div class="public-shell">
    <a href="#main-content" class="skip-link">Đến nội dung chính</a>
    <header class="club-header">
      <div class="club-header-inner">
        <Brand light />
        <nav class="club-desktop-nav" aria-label="Điều hướng chính">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :aria-current="isActive(item) ? 'page' : undefined"
            :class="['club-nav-link', { active: isActive(item) }]"
          >{{ item.label }}</RouterLink>
        </nav>
        <div class="club-header-actions">
          <details v-if="userName" ref="account" class="club-account">
            <summary>
              <span class="club-avatar">{{ userName.charAt(0).toUpperCase() }}</span>
              <span class="club-user-name">{{ userName }}</span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div class="club-account-menu">
              <button @click="go('/lich-su-dat-san')">Lịch sử đặt sân</button>
              <button @click="go('/yeu-thich')">Sân yêu thích</button>
              <button @click="go('/ho-so')">Hồ sơ &amp; mật khẩu</button>
              <button @click="logout">Đăng xuất</button>
            </div>
          </details>
          <template v-else>
            <button class="club-login" @click="go('/dang-nhap')">Đăng nhập</button>
            <button class="club-register" @click="go('/dang-ky')">Đăng ký</button>
          </template>
          <button ref="trigger" class="club-menu-trigger" aria-label="Mở menu điều hướng" :aria-expanded="open" aria-controls="public-menu" @click="open = !open">☰</button>
        </div>
      </div>
    </header>

    <div v-if="open" class="club-drawer-backdrop" @click="open = false">
      <nav id="public-menu" ref="drawer" class="club-mobile-nav" aria-label="Điều hướng mobile" @click.stop>
        <button class="club-drawer-close" aria-label="Đóng menu" @click="open = false; trigger?.focus()">×</button>
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" :class="['club-nav-link', { active: isActive(item) }]">{{ item.label }}</RouterLink>
        <button v-if="!userName" @click="go('/dang-nhap')">Đăng nhập</button>
      </nav>
    </div>

    <main id="main-content"><slot /></main>

    <footer class="club-footer">
      <div>
        <Brand light />
        <p>Tìm sân phù hợp. Chọn lịch rõ ràng.<br />Sẵn sàng cho trận đấu tiếp theo.</p>
      </div>
      <nav aria-label="Điều hướng cuối trang">
        <RouterLink to="/tim-san">Tìm sân bóng</RouterLink>
        <RouterLink to="/yeu-thich">Sân yêu thích</RouterLink>
        <RouterLink to="/#how-it-works">Cách đặt sân</RouterLink>
      </nav>
      <span>© {{ year }} SÂN BÓNG PRO<br /><small>YOUR NEXT GAME STARTS HERE.</small></span>
    </footer>
  </div>
</template>
