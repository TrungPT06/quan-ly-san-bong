<script setup>
defineProps({
  to: { type: [String, Object], default: "/" },
  light: { type: Boolean, default: false },
  accent: { type: Boolean, default: false },
});
</script>

<template>
  <RouterLink :to="to" class="club-brand" :class="{ 'club-brand-light': light }" aria-label="Sân Bóng Pro — Trang chủ">
    <span class="club-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" width="32" height="32">
        <circle cx="20" cy="20" r="18" fill="white" stroke="#0B0F14" stroke-width="1.5" />
        <path d="M20 11 28 17 25 27 15 27 12 17Z M17 2 23 2 25 6 20 10 15 6Z M2 16 7 12 11 16 8 23 2 23Z M38 16 33 12 29 16 32 23 38 23Z M9 34 11 28 15 28 19 36 15 38Z M31 34 29 28 25 28 21 36 25 38Z" fill="#0B0F14" />
        <path d="M20 10V11 M11 16 12 17 M28 17 29 16 M15 27 15 28 M25 27 25 28" stroke="#0B0F14" />
      </svg>
    </span>
    <span>
      <strong>
        <template v-if="accent">SÂN BÓNG <span class="club-auth-brand-accent">PRO</span></template>
        <template v-else>SÂN BÓNG PRO</template>
      </strong>
      <small>SPORTS BOOKING PLATFORM</small>
    </span>
  </RouterLink>
</template>
