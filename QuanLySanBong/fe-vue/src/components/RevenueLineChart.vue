<script setup>
import { computed } from "vue";

const props = defineProps({ rows: { type: Array, required: true } });

const money = (value) => Number(value || 0).toLocaleString("vi-VN");
const maximum = computed(() => Math.max(...props.rows.map((row) => Number(row.giaTri || 0)), 1));
const points = computed(() =>
  props.rows.map((row, index) => [42 + (index * 508) / Math.max(props.rows.length - 1, 1), 178 - (Number(row.giaTri || 0) / maximum.value) * 135]),
);
const line = computed(() => points.value.map((point, index) => `${index ? "L" : "M"}${point.join(",")}`).join(" "));
const area = computed(() => (points.value.length ? `${line.value} L550,178 L42,178 Z` : ""));
const ticks = computed(() => [0, 1, 2, 3].map((tick) => ({ tick, y: 178 - tick * 45, label: ((maximum.value * tick) / 3 / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) })));
const hasData = computed(() => props.rows.some((row) => Number(row.giaTri) > 0));
</script>

<template>
  <div class="dashboard-chart">
    <svg viewBox="0 0 580 215" role="img" aria-label="Biểu đồ doanh thu theo ngày trong tuần">
      <defs>
        <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#DA1A32" stop-opacity=".2" />
          <stop offset="100%" stop-color="#DA1A32" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-for="t in ticks" :key="t.tick">
        <line x1="42" x2="550" :y1="t.y" :y2="t.y" stroke="#e5e7eb" stroke-dasharray="3 4" />
        <text x="35" :y="t.y + 3" text-anchor="end" fill="#64748b" font-size="9">{{ t.label }}k</text>
      </g>
      <path :d="area" fill="url(#revenue-fill)" />
      <path :d="line" fill="none" stroke="#DA1A32" stroke-width="2.5" stroke-linejoin="round" />
      <g v-for="([x, y], index) in points" :key="rows[index].ngay">
        <circle :cx="x" :cy="y" r="3" fill="#DA1A32"><title>{{ `${rows[index].ngay}: ${money(rows[index].giaTri)} đ` }}</title></circle>
        <text :x="x" y="202" text-anchor="middle" fill="#64748b" font-size="10">{{ rows[index].ngay }}</text>
      </g>
    </svg>
    <div class="sr-only"><p v-for="row in rows" :key="row.ngay">{{ row.ngay }}: {{ money(row.giaTri) }} đồng</p></div>
    <p v-if="!hasData" class="dashboard-chart-empty">Chưa có doanh thu đã thanh toán trong tuần.</p>
  </div>
</template>
