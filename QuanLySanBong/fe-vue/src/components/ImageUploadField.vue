<script setup>
defineProps({
  label: { type: String, default: "" },
  value: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  helperText: { type: String, default: "PNG, JPG, WEBP tối đa 10MB" },
});
const emit = defineEmits(["change", "clear"]);
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-sm font-medium text-gray-700">{{ label }}</label>
    <div v-if="value" class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
      <div class="flex h-[clamp(150px,26vh,230px)] items-center justify-center bg-slate-100">
        <img :src="value" alt="Preview ảnh sân" class="h-full w-full object-contain" />
      </div>
      <div class="flex items-center justify-between gap-3 p-3">
        <span class="truncate text-xs font-medium text-gray-600">Ảnh đã chọn</span>
        <div class="flex items-center gap-2">
          <label class="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700">
            {{ loading ? "Đang tải..." : "Thay ảnh" }}
            <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="loading" class="hidden" @change="emit('change', $event)" />
          </label>
          <button type="button" :disabled="loading" class="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600" @click="emit('clear')">Xóa ảnh</button>
        </div>
      </div>
    </div>
    <label v-else class="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-green-400 hover:bg-green-50">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm group-hover:shadow-md">🖼️</div>
      <div>
        <p class="text-sm font-bold text-gray-700">Kéo ảnh vào đây hoặc chọn ảnh</p>
        <p class="mt-1 text-xs text-gray-500">{{ helperText }}</p>
      </div>
      <span class="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white shadow-sm">{{ loading ? "Đang tải..." : "Chọn ảnh" }}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="loading" class="hidden" @change="emit('change', $event)" />
    </label>
  </div>
</template>
