<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { adminApi } from "../../api/adminApi";
import { errorMessage } from "../../composables/useApiError";
import { exclusiveAction } from "../../utils/exclusiveAction";

const emptyForm = () => ({ tenCum: "", diaChi: "", moTa: "" });

const loading = ref(true);
const busy = ref(false);
const clusters = ref([]);
const staff = ref([]);
const form = reactive(emptyForm());
const editing = ref(null);
const assignments = ref({});
const error = ref("");
const message = ref("");

const fieldStaff = computed(() => staff.value.filter((p) => p.vaiTro === "NHAN_VIEN_PAGE" || p.vaiTro === "NHAN_VIEN_SAN"));

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [clusterResponse, staffResponse] = await Promise.all([adminApi.getCumSan(), adminApi.getNhanVien()]);
    clusters.value = clusterResponse.data || [];
    staff.value = staffResponse.data || [];
    assignments.value = Object.fromEntries(staff.value.map((person) => [person.id, person.cumSanId ? String(person.cumSanId) : ""]));
  } catch (err) {
    error.value = errorMessage(err, "Không tải được dữ liệu cụm sân.");
  } finally {
    loading.value = false;
  }
}

const save = exclusiveAction(async () => {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    if (editing.value) await adminApi.suaCumSan(editing.value.id, { ...form });
    else await adminApi.taoCumSan({ ...form });
    editing.value = null;
    Object.assign(form, emptyForm());
    message.value = "Đã lưu cụm sân.";
    await load();
  } catch (err) {
    error.value = errorMessage(err, "Không thể lưu cụm sân.");
  } finally {
    busy.value = false;
  }
});

function edit(cluster) {
  editing.value = cluster;
  Object.assign(form, { tenCum: cluster.tenCum, diaChi: cluster.diaChi || "", moTa: cluster.moTa || "" });
}
function cancel() {
  editing.value = null;
  Object.assign(form, emptyForm());
}

const assign = exclusiveAction(async (person) => {
  try {
    await adminApi.phanCongCumSan(person.id, assignments.value[person.id] ? Number(assignments.value[person.id]) : null);
    message.value = `Đã cập nhật cụm phụ trách cho ${person.hoTen || person.email}.`;
  } catch (err) {
    error.value = errorMessage(err, "Không thể phân công nhân viên.");
  }
});

const remove = exclusiveAction(async (cluster) => {
  try {
    await adminApi.xoaCumSan(cluster.id);
    message.value = "Đã xóa cụm sân.";
    await load();
  } catch (err) {
    error.value = errorMessage(err, "Không thể xóa cụm sân đang có sân.");
  }
});

onMounted(load);
</script>

<template>
  <section class="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
    <header>
      <p class="text-xs font-black uppercase tracking-[0.18em] text-red-700">Quản trị hệ thống</p>
      <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Quản lý cụm sân</h1>
    </header>
    <p v-if="loading" role="status">Đang tải cụm sân và nhân viên…</p>
    <p v-if="busy" role="status">Đang lưu…</p>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{{ error }} <button type="button" @click="load">Thử lại</button></p>
    <p v-if="message" role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{{ message }}</p>

    <form class="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5" @submit.prevent="save">
      <h2 class="text-lg font-black text-slate-900 sm:col-span-2">{{ editing ? "Sửa cụm sân" : "Tạo cụm sân" }}</h2>
      <label class="text-xs font-bold text-slate-600">Tên cụm<input v-model="form.tenCum" required maxlength="100" class="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <label class="text-xs font-bold text-slate-600">Địa chỉ<input v-model="form.diaChi" maxlength="255" class="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <label class="text-xs font-bold text-slate-600 sm:col-span-2">Mô tả<textarea v-model="form.moTa" rows="2" class="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <div class="flex gap-2 sm:col-span-2">
        <button :disabled="busy || loading" class="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800">{{ editing ? "Cập nhật" : "Tạo cụm" }}</button>
        <button v-if="editing" type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold" @click="cancel">Hủy sửa</button>
      </div>
    </form>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[650px] text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500"><tr><th class="p-3">Cụm</th><th class="p-3">Địa chỉ</th><th class="p-3">Số sân</th><th class="p-3 text-right">Thao tác</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="cluster in clusters" :key="cluster.id">
              <td class="p-3 font-bold">{{ cluster.tenCum }}</td>
              <td class="p-3">{{ cluster.diaChi || "—" }}</td>
              <td class="p-3">{{ cluster.soSan }}</td>
              <td class="p-3 text-right">
                <button type="button" class="mr-3 font-bold text-blue-700" @click="edit(cluster)">Sửa</button>
                <button type="button" class="font-bold text-red-700" @click="remove(cluster)">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 p-4"><h2 class="font-black text-slate-900">Phân công nhân viên</h2></div>
      <div class="divide-y divide-slate-100">
        <div v-for="person in fieldStaff" :key="person.id" class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div class="min-w-0 flex-1"><p class="font-bold text-slate-900">{{ person.hoTen || person.email }}</p><p class="text-xs text-slate-500">{{ person.vaiTro }}</p></div>
          <select v-model="assignments[person.id]" :aria-label="`Cụm phụ trách của ${person.hoTen || person.email}`" class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="">Chưa phân công</option>
            <option v-for="cluster in clusters" :key="cluster.id" :value="String(cluster.id)">{{ cluster.tenCum }}</option>
          </select>
          <button type="button" class="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800" @click="assign(person)">Lưu phân công</button>
        </div>
      </div>
    </section>
  </section>
</template>
