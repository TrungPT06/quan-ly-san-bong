<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";
import PublicLayout from "./layouts/PublicLayout.vue";
import OperationsLayout from "./layouts/OperationsLayout.vue";
import AIChatbot from "./components/AIChatbot.vue";

const route = useRoute();
const auth = useAuthStore();

// Trang đăng nhập/đăng ký dùng layout riêng; nhân viên/quản trị dùng layout điều hành.
const shell = computed(() => (auth.isOperations ? OperationsLayout : PublicLayout));
// Chatbot tư vấn chỉ hiển thị cho khách và khách hàng
const showChatbot = computed(() => !route.meta.bare && !auth.isOperations);
</script>

<template>
  <RouterView v-if="route.meta.bare" />
  <component :is="shell" v-else>
    <RouterView />
  </component>
  <AIChatbot v-if="showChatbot" />
</template>
