<script setup>
import { computed } from "vue";

const props = defineProps({ fields: { type: Array, required: true } });
const colors = ["#DA1A32", "#159A55", "#3B82F6", "#F59E0B", "#64748B"];

const segments = computed(() => {
  const counts = props.fields.reduce((result, field) => {
    const type = field.loaiSan || "Chưa phân loại";
    result[type] = (result[type] || 0) + 1;
    return result;
  }, {});
  let start = 0;
  return Object.entries(counts).map(([name, count], index) => {
    const size = (count / props.fields.length) * 100;
    const segment = { name, count, size, start, color: colors[index % colors.length] };
    start += size;
    return segment;
  });
});
</script>

<template>
  <p v-if="!fields.length" class="dashboard-chart-empty">Chưa có dữ liệu loại sân.</p>
  <div v-else class="dashboard-donut">
    <svg viewBox="0 0 120 120" role="img" :aria-label="`Phân bố loại sân, tổng ${fields.length} sân`">
      <circle cx="60" cy="60" r="44" fill="none" stroke="#e5e7eb" stroke-width="19" />
      <circle
        v-for="segment in segments"
        :key="segment.name"
        cx="60" cy="60" r="44" fill="none" :stroke="segment.color" stroke-width="19" pathLength="100"
        :stroke-dasharray="`${segment.size} ${100 - segment.size}`" :stroke-dashoffset="-segment.start" transform="rotate(-90 60 60)"
      ><title>{{ `${segment.name}: ${segment.count} sân` }}</title></circle>
      <text x="60" y="60" text-anchor="middle" dominant-baseline="middle" font-size="22" font-weight="800" fill="#0b0f14">{{ fields.length }}</text>
      <text x="60" y="76" text-anchor="middle" font-size="9" fill="#64748b">SÂN BÓNG</text>
    </svg>
    <ul>
      <li v-for="segment in segments" :key="segment.name"><i :style="{ background: segment.color }" />{{ segment.name }}<strong>{{ segment.count }} ({{ Math.round(segment.size) }}%)</strong></li>
    </ul>
  </div>
</template>
