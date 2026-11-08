<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import DialogShell from "../../components/DialogShell.vue";
import { adminApi } from "../../api/adminApi";
import { exclusiveAction } from "../../utils/exclusiveAction";

const saving = ref(false);
const list = ref([]);
const showModal = ref(false);
const editingItem = ref(null);
const searchTerm = ref("");
const formData = reactive({ hoTen: "", sdt: "", email: "", password: "" });
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    list.value = (await adminApi.getKhachHang()).data || [];
  } catch (err) {
    error.value = err.message || "Không tải được danh sách.";
  } finally {
    loading.value = false;
  }
}

const filtered = computed(() =>
  list.value.filter((user) => {
    const text = `${user.hoTen || ""} ${user.username || ""} ${user.sdt || ""} ${user.email || ""}`.toLowerCase();
    return !searchTerm.value || text.includes(searchTerm.value.toLowerCase());
  }),
);

function openAdd() {
  editingItem.value = null;
  Object.assign(formData, { hoTen: "", sdt: "", email: "", password: "" });
  showModal.value = true;
}
function openEdit(item) {
  editingItem.value = item;
  Object.assign(formData, { hoTen: item.hoTen || item.username, sdt: item.sdt || "", email: item.email || "", password: "" });
  showModal.value = true;
}

const save = exclusiveAction(async () => {
  if (saving.value) return;
  if (!formData.hoTen || (!editingItem.value && (!formData.email || (formData.password || "").length < 8))) {
    alert("Nhập họ tên, email và mật khẩu ít nhất 8 ký tự để tạo tài khoản.");
    return;
  }
  saving.value = true;
  try {
    const body = { ...formData };
    if (editingItem.value) await adminApi.suaKhachHang(editingItem.value.id, body);
    else await adminApi.themKhachHang(body);
    showModal.value = false;
    await load();
  } catch (err) {
    alert(err?.message || "Lỗi lưu thông tin khách hàng!");
  } finally {
    saving.value = false;
  }
});

const toggleLock = exclusiveAction(async (id) => {
  try {
    await adminApi.toggleKhoaKhachHang(id);
    await load();
  } catch (err) {
    alert(err?.message || "Cập nhật trạng thái khóa thất bại!");
  }
});

const remove = exclusiveAction(async (id) => {
  if (!window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) return;
  try {
    await adminApi.xoaKhachHang(id);
    await load();
  } catch (err) {
    alert(err?.message || "Xóa khách hàng thất bại!");
  }
});

onMounted(load);
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.24em] text-red-700">Customer management</p>
        <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-900">QUẢN LÝ KHÁCH HÀNG</h1>
        <p class="mt-1 text-xs font-medium text-slate-500">Theo dõi tài khoản khách hàng và trạng thái hoạt động.</p>
      </div>
      <button class="rounded-xl bg-[#DA1A32] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-none transition hover:bg-[#B51228]" @click="openAdd">+ Thêm khách hàng</button>
    </div>

    <p v-if="loading" role="status">Đang tải danh sách...</p>
    <p v-if="error" role="alert" class="text-red-700">{{ error }} <button type="button" @click="load">Thử lại</button></p>
    <div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <label class="relative block">
        <span class="sr-only">Tìm kiếm khách hàng</span>
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
        <input v-model="searchTerm" placeholder="Tìm theo tên, email, số điện thoại" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10" />
      </label>
    </div>

    <div v-if="filtered.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm font-semibold text-slate-500">Không tìm thấy khách hàng phù hợp.</div>
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="bg-slate-50 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            <tr><th class="px-4 py-3">Khách hàng</th><th class="px-4 py-3">Liên hệ</th><th class="px-4 py-3">Trạng thái</th><th class="px-4 py-3 text-right">Hành động</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="user in filtered" :key="user.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-red-700">{{ (user.hoTen || user.username || "U").charAt(0).toUpperCase() }}</div>
                  <div><div class="font-black text-slate-900">{{ user.hoTen || user.username }}</div><div class="text-[11px] text-slate-400">ID: {{ user.id }}</div></div>
                </div>
              </td>
              <td class="px-4 py-3"><div>{{ user.sdt || "Chưa có SĐT" }}</div><div class="text-slate-400">{{ user.email || "Chưa có Email" }}</div></td>
              <td class="px-4 py-3"><span :class="['inline-flex rounded-full px-2.5 py-1 text-[10px] font-black', user.trangThai ? 'bg-emerald-50 text-red-700' : 'bg-red-50 text-red-700']">{{ user.trangThai ? "Hoạt động" : "Bị khóa" }}</span></td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-red-300 hover:text-red-700" @click="openEdit(user)">Sửa</button>
                  <button class="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100" @click="toggleLock(user.id)">{{ user.trangThai ? "Khóa" : "Mở" }}</button>
                  <button class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100" @click="remove(user.id)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DialogShell v-if="showModal" label="Biểu mẫu quản trị" @close="!saving && (showModal = false)">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <h2 class="text-lg font-extrabold text-gray-900">{{ editingItem ? "Sửa Khách Hàng" : "Thêm Khách Hàng" }}</h2>
        <div><label class="text-xs font-bold text-gray-500 block mb-1" for="c-name">Họ tên</label><input id="c-name" v-model="formData.hoTen" type="text" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div><label class="text-xs font-bold text-gray-500 block mb-1" for="c-phone">Số điện thoại</label><input id="c-phone" v-model="formData.sdt" type="text" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div><label class="text-xs font-bold text-gray-500 block mb-1" for="c-email">Email</label><input id="c-email" v-model="formData.email" type="email" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div v-if="!editingItem"><label class="text-xs font-bold text-gray-500 block mb-1" for="c-pass">Mật khẩu tạm thời</label><input id="c-pass" v-model="formData.password" type="password" minlength="8" autocomplete="new-password" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div class="flex gap-2 pt-2">
          <button class="flex-1 bg-gray-100 font-bold py-2 rounded-xl text-xs text-gray-600" @click="showModal = false">Hủy</button>
          <button :disabled="saving" class="flex-1 bg-[#DA1A32] text-white font-bold py-2 rounded-xl text-xs" @click="save">{{ saving ? "Đang lưu…" : "Lưu lại" }}</button>
        </div>
      </div>
    </DialogShell>
  </div>
</template>
