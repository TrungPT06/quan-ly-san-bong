<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import DialogShell from "../../components/DialogShell.vue";
import { adminApi } from "../../api/adminApi";
import { exclusiveAction } from "../../utils/exclusiveAction";

const emptyForm = () => ({ hoTen: "", sdt: "", email: "", vaiTro: "NHAN_VIEN_PAGE", password: "" });

const saving = ref(false);
const staffs = ref([]);
const showModal = ref(false);
const editingItem = ref(null);
const searchTerm = ref("");
const formData = reactive(emptyForm());
const loading = ref(true);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    staffs.value = (await adminApi.getNhanVien()).data || [];
  } catch (err) {
    error.value = err.message || "Không tải được danh sách.";
  } finally {
    loading.value = false;
  }
}

const filtered = computed(() =>
  staffs.value.filter((s) => {
    const text = `${s.hoTen || ""} ${s.username || ""} ${s.sdt || ""} ${s.email || ""} ${s.vaiTro || ""}`.toLowerCase();
    return !searchTerm.value || text.includes(searchTerm.value.toLowerCase());
  }),
);

function openAdd() {
  editingItem.value = null;
  Object.assign(formData, emptyForm());
  showModal.value = true;
}
function openEdit(item) {
  editingItem.value = item;
  Object.assign(formData, { hoTen: item.hoTen || item.username, sdt: item.sdt || "", email: item.email || "", vaiTro: item.vaiTro || "NHAN_VIEN_PAGE", password: "" });
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
    if (editingItem.value) await adminApi.suaNhanVien(editingItem.value.id, body);
    else await adminApi.themNhanVien(body);
    showModal.value = false;
    await load();
  } catch (err) {
    alert(err?.message || "Lỗi lưu thông tin nhân viên!");
  } finally {
    saving.value = false;
  }
});

const toggleLock = exclusiveAction(async (id) => {
  try {
    await adminApi.toggleKhoaNhanVien(id);
    await load();
  } catch (err) {
    alert(err?.message || "Cập nhật trạng thái thất bại!");
  }
});

const remove = exclusiveAction(async (id) => {
  if (!window.confirm("Bạn có chắc muốn xóa tài khoản nhân viên này?")) return;
  try {
    await adminApi.xoaNhanVien(id);
    await load();
  } catch (err) {
    alert(err?.message || "Xóa nhân viên thất bại!");
  }
});

onMounted(load);
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.24em] text-red-700">Staff management</p>
        <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-900">QUẢN LÝ NHÂN VIÊN</h1>
        <p class="mt-1 text-xs font-medium text-slate-500">Phân quyền và quản lý tài khoản nhân viên nội bộ.</p>
      </div>
      <button class="rounded-xl bg-[#DA1A32] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-none transition hover:bg-[#B51228]" @click="openAdd">+ Thêm nhân viên</button>
    </div>

    <p v-if="loading" role="status">Đang tải danh sách...</p>
    <p v-if="error" role="alert" class="text-red-700">{{ error }} <button type="button" @click="load">Thử lại</button></p>
    <div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <label class="relative block">
        <span class="sr-only">Tìm kiếm nhân viên</span>
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
        <input v-model="searchTerm" placeholder="Tìm theo tên, email, số điện thoại, vai trò" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10" />
      </label>
    </div>

    <div v-if="filtered.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm font-semibold text-slate-500">Không tìm thấy nhân viên phù hợp.</div>
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[860px] text-left text-sm">
          <thead class="bg-slate-50 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            <tr><th class="px-4 py-3">Nhân viên</th><th class="px-4 py-3">Liên hệ</th><th class="px-4 py-3">Vai trò</th><th class="px-4 py-3">Trạng thái</th><th class="px-4 py-3 text-right">Hành động</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="staff in filtered" :key="staff.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3 font-black text-slate-900">{{ staff.hoTen || staff.username }}</td>
              <td class="px-4 py-3"><div>{{ staff.sdt || "N/A" }}</div><div class="text-slate-400">{{ staff.email || "N/A" }}</div></td>
              <td class="px-4 py-3"><span :class="['inline-flex rounded-full px-2.5 py-1 text-[10px] font-black', staff.vaiTro === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700']">{{ staff.vaiTro }}</span></td>
              <td class="px-4 py-3"><span :class="['inline-flex rounded-full px-2.5 py-1 text-[10px] font-black', staff.trangThai ? 'bg-emerald-50 text-red-700' : 'bg-red-50 text-red-700']">{{ staff.trangThai ? "Hoạt động" : "Bị khóa" }}</span></td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-red-300 hover:text-red-700" @click="openEdit(staff)">Sửa</button>
                  <button class="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100" @click="toggleLock(staff.id)">{{ staff.trangThai ? "Khóa" : "Mở" }}</button>
                  <button class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100" @click="remove(staff.id)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DialogShell v-if="showModal" label="Biểu mẫu quản trị" @close="!saving && (showModal = false)">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
        <h2 class="text-lg font-extrabold text-gray-900">{{ editingItem ? "Sửa Nhân Viên" : "Thêm Nhân Viên" }}</h2>
        <div><label class="text-xs font-bold text-gray-500 block mb-1" for="s-name">Họ tên</label><input id="s-name" v-model="formData.hoTen" type="text" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div><label class="text-xs font-bold text-gray-500 block mb-1" for="s-phone">Số điện thoại</label><input id="s-phone" v-model="formData.sdt" type="text" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div><label class="text-xs font-bold text-gray-500 block mb-1" for="s-email">Email</label><input id="s-email" v-model="formData.email" type="email" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div v-if="!editingItem"><label class="text-xs font-bold text-gray-500 block mb-1" for="s-pass">Mật khẩu tạm thời</label><input id="s-pass" v-model="formData.password" type="password" minlength="8" autocomplete="new-password" class="w-full border rounded-xl p-2.5 text-xs" /></div>
        <div>
          <label class="text-xs font-bold text-gray-500 block mb-1" for="s-role">Vai trò</label>
          <select id="s-role" v-model="formData.vaiTro" class="w-full border rounded-xl p-2.5 text-xs">
            <option value="NHAN_VIEN_PAGE">Nhân viên Trực Page</option><option value="NHAN_VIEN_SAN">Nhân viên Lễ tân POS</option><option value="ADMIN">Quản trị viên (Admin)</option>
          </select>
        </div>
        <div class="flex gap-2 pt-2">
          <button class="flex-1 bg-gray-100 font-bold py-2 rounded-xl text-xs text-gray-600" @click="showModal = false">Hủy</button>
          <button :disabled="saving" class="flex-1 bg-[#DA1A32] text-white font-bold py-2 rounded-xl text-xs" @click="save">{{ saving ? "Đang lưu…" : "Lưu lại" }}</button>
        </div>
      </div>
    </DialogShell>
  </div>
</template>
