<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "../components/AuthLayout.vue";
import PasswordInput from "../components/PasswordInput.vue";
import { authApi } from "../api/authApi";
import { exclusiveAction } from "../utils/exclusiveAction";
import "../assets/css/LoginPage.css";

const router = useRouter();
const form = reactive({ ho: "", ten: "", email: "", soDienThoai: "", matKhau: "", xacNhan: "", dongY: false });
const error = ref("");
const submitting = ref(false);

const submit = exclusiveAction(async () => {
  if (!form.ho || !form.ten || !form.soDienThoai || !form.email || !form.matKhau) {
    error.value = "Vui lòng điền đầy đủ các thông tin yêu cầu";
    return;
  }
  if (form.matKhau !== form.xacNhan) {
    error.value = "Mật khẩu xác nhận không khớp";
    return;
  }
  if (!form.dongY) {
    error.value = "Bạn cần đồng ý với Điều khoản dịch vụ";
    return;
  }
  error.value = "";
  submitting.value = true;
  try {
    await authApi.dangKy({
      username: form.email || form.soDienThoai,
      email: form.email,
      soDienThoai: form.soDienThoai,
      password: form.matKhau,
      hoTen: `${form.ho} ${form.ten}`.trim(),
    });
    alert("Đăng ký tài khoản thành công!");
    router.push("/dang-nhap");
  } catch (err) {
    error.value = err.message || "Đăng ký thất bại";
  } finally {
    submitting.value = false;
  }
});
</script>

<template>
  <AuthLayout variant="register" title="Tạo tài khoản" subtitle="Tham gia Sân Bóng Pro. Bắt đầu trải nghiệm đặt sân của bạn.">
    <p v-if="error" class="club-alert" role="alert">{{ error }}</p>
    <form class="club-auth-fields" @submit.prevent="submit">
      <div class="club-form-row">
        <label for="register-lastname" class="club-form-label">Họ<input id="register-lastname" v-model="form.ho" required autocomplete="family-name" maxlength="50" /></label>
        <label for="register-firstname" class="club-form-label">Tên<input id="register-firstname" v-model="form.ten" required autocomplete="given-name" maxlength="50" /></label>
      </div>
      <label for="register-email" class="club-form-label">Email<input id="register-email" v-model="form.email" required type="email" maxlength="50" autocomplete="email" /></label>
      <label for="register-phone" class="club-form-label">Số điện thoại<input id="register-phone" v-model="form.soDienThoai" required type="tel" autocomplete="tel" /></label>
      <PasswordInput id="register-password" v-model="form.matKhau" label="Mật khẩu" autocomplete="new-password" />
      <PasswordInput id="register-confirm" v-model="form.xacNhan" label="Xác nhận mật khẩu" autocomplete="new-password" />
      <label class="club-checkbox"><input v-model="form.dongY" type="checkbox" />Tôi đồng ý với điều khoản sử dụng</label>
      <button type="submit" class="club-button" :disabled="submitting">{{ submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản" }}</button>
    </form>
    <p class="club-auth-switch">Đã có tài khoản? <RouterLink to="/dang-nhap">Đăng nhập</RouterLink></p>
  </AuthLayout>
</template>
