import { defineStore } from "pinia";
import { ref } from "vue";
import { favoriteApi } from "../api/favoriteApi";

export const useFavoritesStore = defineStore("favorites", () => {
  const ids = ref(new Set());
  const busy = ref(new Set());
  const error = ref("");

  async function load() {
    error.value = "";
    try {
      const items = await favoriteApi.list();
      if (!Array.isArray(items)) throw new Error("Dữ liệu sân yêu thích không hợp lệ.");
      ids.value = new Set(items.map((item) => item.id));
      return items;
    } catch (err) {
      error.value = err.message || "Không thể tải sân yêu thích.";
      return [];
    }
  }
  function clear() {
    ids.value = new Set();
  }
  async function toggle(id) {
    if (busy.value.has(id)) return;
    busy.value = new Set(busy.value).add(id);
    error.value = "";
    try {
      if (ids.value.has(id)) await favoriteApi.remove(id);
      else await favoriteApi.add(id);
      const next = new Set(ids.value);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      ids.value = next;
    } catch (err) {
      error.value = err.message || "Không thể cập nhật sân yêu thích.";
    } finally {
      const next = new Set(busy.value);
      next.delete(id);
      busy.value = next;
    }
  }

  return { ids, busy, error, load, clear, toggle };
});
