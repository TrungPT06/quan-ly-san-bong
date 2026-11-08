<script setup>
import { useCourtsStore } from "../stores/courts";

const emit = defineEmits(["search"]);
const courts = useCourtsStore();
</script>

<template>
  <form class="club-search-bar" aria-label="Tìm sân bóng" @submit.prevent="emit('search')">
    <label>
      <span>⌕ Tên sân</span>
      <input v-model="courts.filters.keyword" type="search" placeholder="Tên sân, khu vực…" />
    </label>
    <label>
      <span>⌖ Khu vực</span>
      <select v-model="courts.filters.cluster">
        <option value="">Tất cả cụm sân</option>
        <option v-for="[id, name] in courts.clusters" :key="id" :value="String(id)">{{ name }}</option>
      </select>
    </label>
    <label>
      <span>⚽ Loại sân</span>
      <select v-model="courts.filters.type">
        <option value="">Tất cả loại sân</option>
        <option v-for="item in courts.types" :key="item" :value="item">{{ item }}</option>
      </select>
    </label>
    <button type="submit" class="club-button">Tìm sân <span aria-hidden="true">→</span></button>
  </form>
</template>
