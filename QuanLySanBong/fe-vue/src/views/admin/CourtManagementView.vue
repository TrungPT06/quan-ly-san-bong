<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import DialogShell from "../../components/DialogShell.vue";
import ImageUploadField from "../../components/ImageUploadField.vue";
import { adminApi } from "../../api/adminApi";
import { fieldImageUrl } from "../../utils/fieldImage";
import { exclusiveAction } from "../../utils/exclusiveAction";

const emptyForm = (cumSanId = "") => ({ tenSan: "", loaiSan: "Sân 5", cumSanId, moTa: "", hinhAnh: "", trangThai: "HOAT_DONG" });

const fields = ref([]);
const cumSanList = ref([]);
const showModal = ref(false);
const uploading = ref(false);
const imagePreview = ref("");
const editingItem = ref(null);
const loading = ref(true);
const error = ref("");
const searchTerm = ref("");
const statusFilter = ref("TAT_CA");
const formError = ref("");
const saving = ref(false);
const formData = reactive(emptyForm());

const placeholder = fieldImageUrl(null);
const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10";

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [sanRes, cumRes] = await Promise.all([adminApi.getSanBong(), adminApi.getCumSan()]);
    if (!Array.isArray(sanRes?.data) || !Array.isArray(cumRes?.data)) throw new Error("API trả danh sách quản trị không hợp lệ.");
    fields.value = sanRes.data;
    cumSanList.value = cumRes.data;
  } catch (err) {
    error.value = err.status === 405 ? "GET /api/admin/san bị Backend từ chối (HTTP 405). Kiểm tra Backend đang chạy bản có endpoint GET quản trị và API_BASE_URL." : err.message || "Không thể tải dữ liệu sân bóng.";
  } finally {
    loading.value = false;
  }
}

const filteredFields = computed(() =>
  fields.value.filter((field) => {
    const text = `${field.tenSan || ""} ${field.tenCumSan || ""} ${field.loaiSan || ""}`.toLowerCase();
    const matchesText = !searchTerm.value || text.includes(searchTerm.value.toLowerCase());
    const matchesStatus = statusFilter.value === "TAT_CA" || (field.trangThai || "HOAT_DONG") === statusFilter.value;
    return matchesText && matchesStatus;
  }),
);

const statusText = (s) => (s === "HOAT_DONG" ? "Hoạt động" : s === "TAM_NGUNG" ? "Tạm ngưng" : s || "Hoạt động");
const statusClass = (s) => (s === "HOAT_DONG" ? "bg-emerald-50 text-red-700" : s === "TAM_NGUNG" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600");

const upload = exclusiveAction(async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  event.target.value = "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
    formError.value = "Chọn ảnh PNG/JPG/WEBP tối đa 10MB.";
    return;
  }
  uploading.value = true;
  formError.value = "";
  try {
    const res = await adminApi.uploadMinIO(file);
    const objectKey = res?.objectKey || res?.data?.objectKey;
    if (!objectKey) throw new Error("API chưa trả object key ảnh.");
    imagePreview.value = res?.url || res?.data?.url || "";
    formData.hinhAnh = objectKey;
  } catch (err) {
    formError.value = err?.message || "Không thể tải ảnh lên MinIO.";
  } finally {
    uploading.value = false;
  }
});

function clearImage() {
  imagePreview.value = "";
  formData.hinhAnh = "";
}
function openAdd() {
  editingItem.value = null;
  imagePreview.value = "";
  Object.assign(formData, emptyForm(cumSanList.value[0]?.id || ""));
  formError.value = "";
  showModal.value = true;
}
function openEdit(field) {
  editingItem.value = field;
  imagePreview.value = field.hinhAnh ? fieldImageUrl(field.hinhAnh) : "";
  Object.assign(formData, { tenSan: field.tenSan || "", loaiSan: field.loaiSan || "Sân 5", cumSanId: field.cumSanId || "", moTa: field.moTa || "", hinhAnh: field.hinhAnh || "", trangThai: field.trangThai || "HOAT_DONG" });
  formError.value = "";
  showModal.value = true;
}
function closeModal() {
  if (!saving.value && !uploading.value) showModal.value = false;
}

const save = exclusiveAction(async () => {
  if (saving.value || uploading.value) return;
  if (!formData.tenSan.trim()) {
    formError.value = "Vui lòng nhập tên sân.";
    return;
  }
  const payload = { tenSan: formData.tenSan.trim(), loaiSan: formData.loaiSan, hinhAnh: formData.hinhAnh || "", moTa: formData.moTa || "", cumSanId: formData.cumSanId || null };
  const status = formData.trangThai || "HOAT_DONG";
  saving.value = true;
  try {
    if (editingItem.value) {
      await adminApi.suaSanBong(editingItem.value.id, payload);
      if (status !== (editingItem.value.trangThai || "HOAT_DONG")) await adminApi.updateTrangThaiSan(editingItem.value.id, status);
    } else {
      const saved = await adminApi.themSanBong(payload);
      if (status !== "HOAT_DONG") await adminApi.updateTrangThaiSan(saved?.id || saved?.data?.id, status);
    }
    showModal.value = false;
    await loadData();
  } catch (err) {
    formError.value = err?.message || "Lỗi khi lưu dữ liệu sân bóng.";
  } finally {
    saving.value = false;
  }
});

const remove = exclusiveAction(async (id) => {
  if (!window.confirm("Bạn có chắc chắn muốn xóa sân bóng này khỏi hệ thống?")) return;
  try {
    await adminApi.xoaSanBong(id);
    await loadData();
  } catch (err) {
    alert(err?.message || "Xóa sân thất bại!");
  }
});

const toggleStatus = exclusiveAction(async (field) => {
  try {
    await adminApi.updateTrangThaiSan(field.id, field.trangThai === "HOAT_DONG" ? "TAM_NGUNG" : "HOAT_DONG");
    await loadData();
  } catch (err) {
    alert(err?.message || "Không thể cập nhật trạng thái sân.");
  }
});

function onImgError(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = placeholder;
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.24em] text-red-700">Field management</p>
        <h1 class="mt-1 text-2xl font-black tracking-tight text-slate-900">QUẢN LÝ SÂN BÓNG</h1>
        <p class="mt-1 text-xs font-medium text-slate-500">Theo dõi trạng thái, ảnh và lịch sử hoạt động của từng sân.</p>
      </div>
      <button type="button" class="rounded-xl bg-[#DA1A32] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-none transition hover:bg-[#B51228]" @click="openAdd">+ Thêm sân mới</button>
    </div>

    <p v-if="loading" role="status">Đang tải danh sách...</p>
    <div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="grid gap-3 md:grid-cols-[1.3fr_220px_190px]">
        <label class="relative block">
          <span class="sr-only">Tìm kiếm sân</span>
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          <input v-model="searchTerm" placeholder="Tìm theo tên sân, cụm sân, loại sân" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-red-600 focus:bg-white focus:ring-4 focus:ring-red-600/10" />
        </label>
        <select v-model="statusFilter" aria-label="Lọc trạng thái sân" class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-red-600 focus:ring-4 focus:ring-red-600/10">
          <option value="TAT_CA">Tất cả trạng thái</option><option value="HOAT_DONG">Hoạt động</option><option value="TAM_NGUNG">Tạm ngưng</option>
        </select>
        <button type="button" class="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-red-300 hover:text-red-700" @click="loadData">Làm mới</button>
      </div>
    </div>

    <div v-if="error" role="alert" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }} <button type="button" @click="loadData">Thử lại</button></div>

    <div v-if="loading" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm font-semibold text-slate-500">Đang tải dữ liệu sân...</div>
    <div v-else-if="filteredFields.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm font-semibold text-slate-500">Không tìm thấy sân phù hợp. Thử thay đổi từ khóa hoặc bộ lọc.</div>
    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th class="px-4 py-3">Hình ảnh</th><th class="px-4 py-3">Tên sân</th><th class="px-4 py-3">Loại sân</th><th class="px-4 py-3">Cụm sân</th>
              <th class="px-4 py-3">Giá</th><th class="px-4 py-3">Trạng thái</th><th class="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="field in filteredFields" :key="field.id" class="hover:bg-slate-50/80">
              <td class="px-4 py-3"><img :src="fieldImageUrl(field.hinhAnh)" :alt="field.tenSan" class="h-14 w-20 rounded-xl object-cover ring-1 ring-slate-200" @error="onImgError" /></td>
              <td class="px-4 py-3"><div class="font-black text-slate-900">{{ field.tenSan }}</div></td>
              <td class="px-4 py-3">{{ field.loaiSan || "Sân 5" }}</td>
              <td class="px-4 py-3">{{ field.tenCumSan || "Chưa phân cụm" }}</td>
              <td class="px-4 py-3 font-bold text-red-700">{{ field.giaThapNhat ? `${Number(field.giaThapNhat).toLocaleString("vi-VN")} đ` : "Chưa có giá" }}</td>
              <td class="px-4 py-3"><span :class="['inline-flex rounded-full px-2.5 py-1 text-[10px] font-black', statusClass(field.trangThai)]">{{ statusText(field.trangThai) }}</span></td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <button type="button" class="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-red-300 hover:text-red-700" @click="toggleStatus(field)">{{ field.trangThai === "HOAT_DONG" ? "Tạm ngưng" : "Kích hoạt" }}</button>
                  <button type="button" class="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:border-red-300 hover:text-red-700" @click="openEdit(field)">Sửa</button>
                  <button type="button" class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-600 transition hover:bg-red-100" @click="remove(field.id)">Xóa</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DialogShell v-if="showModal" label="Biểu mẫu quản trị" @close="closeModal">
      <div class="my-auto max-h-[calc(100dvh-4rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-red-700">Field form</p>
            <h2 class="mt-1 text-2xl font-black text-slate-900">{{ editingItem ? "Sửa sân bóng" : "Thêm sân bóng" }}</h2>
          </div>
          <button type="button" class="rounded-full bg-slate-100 px-2.5 py-1 text-lg font-bold text-slate-600" @click="closeModal">×</button>
        </div>
        <div v-if="formError" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ formError }}</div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2"><label class="mb-1.5 block text-sm font-semibold text-slate-700" for="f-name">Tên sân</label><input id="f-name" v-model="formData.tenSan" type="text" :class="inputClass" placeholder="Nhập tên sân" /></div>
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700" for="f-cum">Cụm sân</label>
            <select id="f-cum" v-model="formData.cumSanId" :class="inputClass">
              <option value="">Chưa phân cụm</option>
              <option v-for="cum in cumSanList" :key="cum.id" :value="cum.id">{{ cum.tenCum || cum.name || `Cụm ${cum.id}` }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700" for="f-type">Loại sân</label>
            <select id="f-type" v-model="formData.loaiSan" :class="inputClass"><option>Sân 5</option><option>Sân 7</option><option>Sân 11</option><option>Sân mini</option></select>
          </div>
          <div class="md:col-span-2"><label class="mb-1.5 block text-sm font-semibold text-slate-700" for="f-desc">Mô tả</label><textarea id="f-desc" v-model="formData.moTa" rows="3" :class="inputClass" placeholder="Mô tả sân, tiện ích, vị trí..." /></div>
          <div class="md:col-span-2">
            <label class="mb-1.5 block text-sm font-semibold text-slate-700" for="f-status">Trạng thái</label>
            <select id="f-status" v-model="formData.trangThai" :class="inputClass"><option value="HOAT_DONG">Hoạt động</option><option value="TAM_NGUNG">Tạm ngưng</option></select>
          </div>
          <div class="md:col-span-2"><ImageUploadField label="Ảnh sân" :value="imagePreview" :loading="uploading" @change="upload" @clear="clearImage" /></div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50" @click="closeModal">Hủy</button>
          <button type="button" :disabled="saving || uploading" class="rounded-xl bg-[#DA1A32] px-4 py-2.5 text-sm font-black text-white shadow-md shadow-none transition hover:bg-[#B51228] disabled:opacity-50" @click="save">{{ saving ? "Đang lưu…" : editingItem ? "Cập nhật sân" : "Thêm sân" }}</button>
        </div>
      </div>
    </DialogShell>
  </div>
</template>
