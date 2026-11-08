<script setup>
import Brand from "./Brand.vue";
import "../assets/css/AuthLayout.css";

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  variant: { type: String, default: "login", validator: (v) => ["login", "register"].includes(v) },
});
</script>

<template>
  <main :class="['club-auth', 'club-auth-centered', `club-auth-${variant}`]">
    <div class="club-auth-stadium-copy club-auth-stadium-copy-left" aria-hidden="true">DREAMS<br />MAKE<br />BETTER<br />PLAYERS</div>
    <div class="club-auth-stadium-copy club-auth-stadium-copy-right" aria-hidden="true">DREAMS<br />MAKE<br />BETTER<br />PLAYERS</div>
    <section class="club-auth-panel" aria-labelledby="auth-heading">
      <div class="club-auth-form">
        <Brand accent />
        <h1 id="auth-heading">{{ title }}</h1>
        <p class="club-auth-subtitle">{{ subtitle }}</p>
        <slot />
        <RouterLink class="club-auth-back" to="/">← Về trang chủ</RouterLink>
      </div>
    </section>
  </main>
</template>
