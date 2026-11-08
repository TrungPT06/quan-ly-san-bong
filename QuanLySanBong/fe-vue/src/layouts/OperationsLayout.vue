<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Brand from "../components/Brand.vue";
import { NAV, ROLE_COLORS, ROLE_LABELS } from "../components/navigationConfig";
import { homeFor, useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const menuOpen = ref(false);
const sidebar = ref(null);
const toggleButton = ref(null);

const role = computed(() => auth.role);
const navItems = computed(() => NAV[role.value] || []);
const currentLabel = computed(() => navItems.value.find((item) => item.to === route.path)?.label || "Hồ sơ cá nhân");
const roleLabel = computed(() => ROLE_LABELS[role.value] || ROLE_LABELS.guest);
const roleColor = computed(() => ROLE_COLORS[role.value] || ROLE_COLORS.guest);

function logout() {
  auth.logout();
  router.push("/");
}

function onKey(event) {
  if (event.key === "Escape") {
    menuOpen.value = false;
    toggleButton.value?.focus();
  }
  if (event.key === "Tab" && sidebar.value) {
    const items = [...sidebar.value.querySelectorAll("a, button")].filter((item) => item.offsetParent !== null);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
watch(menuOpen, async (value) => {
  if (value) {
    await nextTick();
    sidebar.value?.querySelector("a, button")?.focus();
    document.addEventListener("keydown", onKey);
  } else {
    document.removeEventListener("keydown", onKey);
  }
});
watch(() => route.fullPath, () => { menuOpen.value = false; });
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="operations-shell flex min-h-screen">
    <aside
      ref="sidebar"
      :role="menuOpen ? 'dialog' : undefined"
      :aria-modal="menuOpen ? 'true' : undefined"
      aria-label="Điều hướng điều hành"
      :class="[menuOpen ? 'block' : 'hidden', 'fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto lg:static lg:block operations-sidebar shrink-0 p-4']"
    >
      <div class="operations-brand"><Brand :to="homeFor(role)" light /></div>
      <button v-if="menuOpen" type="button" class="operations-close lg:hidden" aria-label="Đóng menu điều hành" @click="menuOpen = false">×</button>

      <nav class="space-y-1.5">
        <p v-if="role === 'admin'" class="px-3.5 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#64748B]">Quản trị hệ thống</p>
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :aria-current="route.path === item.to ? 'page' : undefined"
          :class="['operations-nav flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-semibold transition', { active: route.path === item.to }]"
        >
          <span aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
        <button
          type="button"
          class="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#f4d5d5] bg-[#fff3f3] px-3.5 py-2.5 text-sm font-bold text-[#dc2626] transition hover:bg-[#fee2e2]"
          @click="logout"
        >↪ Đăng xuất</button>
      </nav>
    </aside>

    <button v-if="menuOpen" type="button" aria-label="Đóng menu" class="fixed inset-0 z-40 bg-black/30 lg:hidden" @click="menuOpen = false" />

    <div class="relative flex min-w-0 flex-1 flex-col">
      <header class="operations-header sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white/85 px-4 backdrop-blur-sm sm:px-8">
        <button ref="toggleButton" type="button" aria-label="Mở menu điều hướng" :aria-expanded="menuOpen" class="mr-3 h-11 w-11 shrink-0 rounded-xl border border-slate-200 lg:hidden" @click="menuOpen = !menuOpen">☰</button>
        <div class="min-w-0">
          <p class="truncate text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#DA1A32]">{{ roleLabel || "Trung tâm điều hành" }}</p>
          <p class="truncate text-sm font-black text-[#0B0F14]">{{ currentLabel }}</p>
        </div>
        <RouterLink
          to="/ho-so"
          aria-label="Mở hồ sơ cá nhân"
          class="flex shrink-0 items-center gap-2.5 rounded-full border border-[#FFF0F2] bg-[#FFF0F2] px-3 py-1.5 transition hover:bg-[#FDE5E9]"
        >
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[#DA1A32] text-xs font-black text-white shadow-sm">{{ auth.displayName.charAt(0).toUpperCase() }}</div>
          <span class="hidden text-sm font-bold text-[#0B0F14] sm:inline">{{ auth.displayName }}</span>
          <span :class="['hidden rounded-full px-2 py-1 text-[10px] font-black sm:inline-flex', roleColor]">{{ roleLabel }}</span>
        </RouterLink>
      </header>
      <main class="operations-content flex-1"><slot /></main>
    </div>
  </div>
</template>
