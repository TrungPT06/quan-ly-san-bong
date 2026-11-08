import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { sanApi } from "../api/sanApi";
import { filterCourts } from "../utils/courtSearch";

export const useCourtsStore = defineStore("courts", () => {
  const courts = ref([]);
  const loading = ref(false);
  const error = ref("");
  // Bộ lọc tìm kiếm (v-model ở trang chủ)
  const filters = ref({ keyword: "", cluster: "", type: "", sort: "name" });

  const filtered = computed(() => filterCourts(courts.value, filters.value));
  const clusters = computed(() => [
    ...new Map(courts.value.filter((c) => c.cumSanId != null && c.tenCumSan).map((c) => [c.cumSanId, c.tenCumSan])).entries(),
  ]);
  const types = computed(() => [...new Set(courts.value.map((c) => c.loaiSan).filter(Boolean))]);

  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const data = await sanApi.danhSachSan();
      if (!Array.isArray(data)) throw new Error("Dữ liệu danh sách sân không hợp lệ.");
      courts.value = data;
    } catch (err) {
      error.value = err.message || "Không thể tải danh sách sân.";
    } finally {
      loading.value = false;
    }
  }
  function resetFilters() {
    filters.value = { keyword: "", cluster: "", type: "", sort: "name" };
  }

  return { courts, loading, error, filters, filtered, clusters, types, load, resetFilters };
});
