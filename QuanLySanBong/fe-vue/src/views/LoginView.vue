<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthLayout from "../components/AuthLayout.vue";
import PasswordInput from "../components/PasswordInput.vue";
import { homeFor, useAuthStore } from "../stores/auth";
import { exclusiveAction } from "../utils/exclusiveAction";
import "../assets/css/LoginPage.css";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const username = ref("");
const password = ref("");
const remember = ref(true);
const error = ref("");
const submitting = ref(false);

const submit = exclusiveAction(async () => {
  if (!username.value || !password.value) {
    error.value = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu";
    return;
  }
  error.value = "";
  submitting.value = true;
  try {
    await auth.login(username.value, password.value, remember.value);
    // Khách hàng quay lại trang đang xem; nhân viên/quản trị vào trang chủ của vai trò
    const target = route.query.redirect;
    if (auth.role === "customer" && typeof target === "string" && target.startsWith("/")) router.push(target);
    else router.push(homeFor(auth.role));
  } catch (err) {
    error.value = err.message || "Tên đăng nhập hoặc mật khẩu không chính xác";
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <AuthLayout title="Đăng nhập" subtitle="Chào mừng bạn trở lại. Đăng nhập để tiếp tục trải nghiệm.">
    <p v-if="error" class="club-alert" role="alert">{{ error }}</p>
    <form class="club-auth-fields" @submit.prevent="submit">
      <label for="login-username" class="club-form-label">
        Email hoặc tên đăng nhập
        <input id="login-username" v-model="username" required autocomplete="username" placeholder="Nhập tài khoản của bạn" />
      </label>
      <PasswordInput id="login-password" v-model="password" label="Mật khẩu" />
      <div class="club-auth-options">
        <label class="club-checkbox"><input v-model="remember" type="checkbox" />Ghi nhớ đăng nhập</label>
        <RouterLink to="/quen-mat-khau">Quên mật khẩu?</RouterLink>
      </div>
      <button type="submit" class="club-button" :disabled="submitting">{{ submitting ? "Đang đăng nhập…" : "Đăng nhập" }}</button>
    </form>
    <p class="club-auth-switch">Chưa có tài khoản? <RouterLink to="/dang-ky">Đăng ký ngay</RouterLink></p>
  </AuthLayout>
</template>
