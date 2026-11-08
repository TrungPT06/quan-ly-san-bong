<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { authApi } from "../api/authApi";
import { getPhien, savePhien } from "../api/http";
import { useAuthStore } from "../stores/auth";
import { exclusiveAction } from "../utils/exclusiveAction";

const auth = useAuthStore();
const phien = computed(() => auth.session);

const profile = reactive({
  hoTen: phien.value?.hoTen || phien.value?.username || "",
  soDienThoai: phien.value?.soDienThoai || phien.value?.sdt || "",
  email: phien.value?.email || "",
});
const avatar = ref(phien.value?.avatar || "");
const password = reactive({ cu: "", moi: "", xacNhan: "" });
const notice = ref({ type: "", text: "" });
const savingPassword = ref(false);
const savingProfile = ref(false);
const profileLoading = ref(true);
const profileError = ref("");

const nameDisplay = computed(() => auth.displayName);
const roleText = computed(() => phien.value?.role || "KHACH_HANG");
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10";

function applyProfile(data) {
  profile.hoTen = data.hoTen || "";
  profile.soDienThoai = data.soDienThoai || data.sdt || "";
  profile.email = data.email || "";
}

async function loadProfile() {
  profileLoading.value = true;
  profileError.value = "";
  try {
    const { data } = await authApi.getProfile();
    applyProfile(data);
    savePhien({ ...getPhien(), ...data });
  } catch (err) {
    profileError.value = err.message || "Không tải được hồ sơ.";
  } finally {
    profileLoading.value = false;
  }
}

function onAvatar(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    notice.value = { type: "loi", text: "Chọn ảnh PNG, JPG, WEBP tối đa 2MB. Ảnh đại diện chỉ lưu trên trình duyệt này." };
    return;
  }
  const reader = new FileReader();
  reader.onload = () => (avatar.value = reader.result);
  reader.readAsDataURL(file);
}

const updateProfile = exclusiveAction(async () => {
  if (savingProfile.value || profileLoading.value || profileError.value) return;
  savingProfile.value = true;
  notice.value = { type: "", text: "" };
  try {
    const res = await authApi.updateProfile({ hoTen: profile.hoTen, soDienThoai: profile.soDienThoai, email: profile.email });
    applyProfile(res.data);
    savePhien({ ...getPhien(), ...res.data, avatar: avatar.value });
    notice.value = { type: "thanhcong", text: "Thông tin cá nhân đã được cập nhật." };
  } catch (err) {
    notice.value = { type: "loi", text: err.message || "Cập nhật thông tin thất bại" };
  } finally {
    savingProfile.value = false;
  }
});

const changePassword = exclusiveAction(async () => {
  if (!password.cu || !password.moi || !password.xacNhan) {
    notice.value = { type: "loi", text: "Vui lòng nhập đầy đủ các trường" };
    return;
  }
  if (password.moi !== password.xacNhan) {
    notice.value = { type: "loi", text: "Mật khẩu mới xác nhận không khớp" };
    return;
  }
  savingPassword.value = true;
  notice.value = { type: "", text: "" };
  try {
    await authApi.doiMatKhau(password.cu, password.moi);
    notice.value = { type: "thanhcong", text: "Đổi mật khẩu thành công!" };
    Object.assign(password, { cu: "", moi: "", xacNhan: "" });
  } catch (err) {
    notice.value = { type: "loi", text: err.message || "Đổi mật khẩu thất bại" };
  } finally {
    savingPassword.value = false;
  }
});

onMounted(loadProfile);
</script>

<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
    <div class="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.24em] text-red-700">Account center</p>
        <h2 class="mt-1 text-3xl font-black tracking-tight text-slate-950">Hồ sơ cá nhân</h2>
        <p class="mt-1 text-sm text-slate-500">Quản lý thông tin và bảo mật tài khoản của bạn.</p>
      </div>
      <span class="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-red-700">{{ roleText }}</span>
    </div>

    <p v-if="profileLoading" role="status" class="mb-4">Đang tải hồ sơ từ hệ thống...</p>
    <div v-if="profileError" role="alert" class="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{{ profileError }} <button type="button" @click="loadProfile">Thử lại</button></div>
    <p class="mb-4 text-xs text-slate-500">Ảnh đại diện chỉ lưu trên trình duyệt này, chưa đồng bộ lên hệ thống.</p>

    <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 bg-gradient-to-r from-emerald-950 to-slate-900 px-5 py-6 text-white sm:px-8">
        <div class="flex items-center gap-4">
          <div class="relative shrink-0">
            <img v-if="avatar" :src="avatar" alt="Ảnh đại diện" class="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/15" />
            <div v-else class="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-400 text-3xl font-black text-emerald-950 ring-4 ring-white/15">{{ nameDisplay.charAt(0).toUpperCase() }}</div>
            <label class="absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black text-slate-900 shadow-lg hover:bg-emerald-100">
              Đổi ảnh
              <input type="file" accept="image/*" class="hidden" @change="onAvatar" />
            </label>
          </div>
          <div>
            <h3 class="text-xl font-black">{{ nameDisplay }}</h3>
            <p class="mt-1 text-sm text-emerald-200">Tài khoản: {{ phien?.username || profile.email || "Chưa cập nhật" }}</p>
            <p class="text-xs font-bold uppercase tracking-wider text-white/60">Thông tin cá nhân</p>
          </div>
        </div>
      </div>

      <form class="space-y-5 p-5 sm:p-8" @submit.prevent="updateProfile">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.2em] text-red-700">01 / Thông tin cá nhân</p>
          <h3 class="mt-1 text-xl font-black text-slate-950">Thông tin cơ bản</h3>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm font-bold text-slate-600">Họ và tên<input v-model="profile.hoTen" :class="inputClass" /></label>
          <label class="text-sm font-bold text-slate-600">Số điện thoại<input v-model="profile.soDienThoai" :class="inputClass" /></label>
          <label class="text-sm font-bold text-slate-600">Email<input v-model="profile.email" type="email" :class="inputClass" /></label>
          <label class="text-sm font-bold text-slate-600">Vai trò trong hệ thống<input :value="roleText" readonly class="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-500" /></label>
        </div>
        <button type="submit" :disabled="savingProfile || profileLoading || Boolean(profileError)" class="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-[#DA1A32] disabled:opacity-50">
          {{ savingProfile ? "Đang cập nhật..." : "Cập nhật thông tin" }}
        </button>
      </form>
    </section>

    <section class="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div class="mb-5">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-red-700">02 / Bảo mật</p>
        <h3 class="mt-1 text-xl font-black text-slate-950">Đổi mật khẩu</h3>
        <p class="mt-1 text-sm text-slate-500">Dùng mật khẩu dài và riêng cho tài khoản này.</p>
      </div>
      <div v-if="notice.text" :class="['mb-4 rounded-xl p-3 text-sm', notice.type === 'thanhcong' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800']">{{ notice.text }}</div>
      <form class="grid gap-4 md:grid-cols-3" @submit.prevent="changePassword">
        <div><label class="block text-sm font-bold text-slate-600" for="pw-old">Mật khẩu hiện tại</label><input id="pw-old" v-model="password.cu" type="password" :class="inputClass" /></div>
        <div><label class="block text-sm font-bold text-slate-600" for="pw-new">Mật khẩu mới <span class="font-normal text-slate-400">(tối thiểu 8 ký tự)</span></label><input id="pw-new" v-model="password.moi" type="password" :class="inputClass" /></div>
        <div><label class="block text-sm font-bold text-slate-600" for="pw-confirm">Xác nhận mật khẩu mới</label><input id="pw-confirm" v-model="password.xacNhan" type="password" :class="inputClass" /></div>
        <button type="submit" :disabled="savingPassword" class="md:col-span-3 w-full rounded-xl bg-[#DA1A32] py-3 text-sm font-black text-white transition hover:bg-[#B51228] disabled:opacity-50">
          {{ savingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu" }}
        </button>
      </form>
    </section>
  </div>
</template>
