import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { aiApi, buildSystemPrompt } from "../api/aiApi";
import { useCourtsStore } from "./courts";

const GREETING = "Xin chào! Mình là trợ lý SÂN BÓNG PRO. Bạn cần tìm sân theo khu vực, loại sân hay mức giá nào?";

export const useChatStore = defineStore("chat", () => {
  const open = ref(false);
  const messages = ref([{ id: 0, role: "assistant", text: GREETING }]);
  const sending = ref(false);
  const error = ref("");
  let nextId = 1;
  let controller = null;

  // Sân được nhắc tên trong câu trả lời gần nhất -> hiển thị nút xem chi tiết
  const suggestedCourts = computed(() => {
    const last = [...messages.value].reverse().find((m) => m.role === "assistant" && m.id !== 0);
    if (!last) return [];
    const text = last.text.toLowerCase();
    return useCourtsStore().courts.filter((court) => court.tenSan && text.includes(court.tenSan.toLowerCase())).slice(0, 4);
  });

  async function send(text) {
    const content = text.trim();
    if (!content || sending.value) return;
    error.value = "";
    messages.value.push({ id: nextId++, role: "user", text: content });
    sending.value = true;
    controller = new AbortController();
    try {
      const courts = useCourtsStore();
      if (!courts.courts.length && !courts.loading) await courts.load();
      const history = messages.value.filter((m) => m.id !== 0).slice(-10);
      const reply = await aiApi.chat(history, buildSystemPrompt(courts.courts), controller.signal);
      messages.value.push({ id: nextId++, role: "assistant", text: reply });
    } catch (err) {
      if (err.name !== "AbortError") error.value = err.message || "Không thể kết nối AI.";
    } finally {
      sending.value = false;
      controller = null;
    }
  }
  function reset() {
    controller?.abort();
    messages.value = [{ id: 0, role: "assistant", text: GREETING }];
    error.value = "";
    sending.value = false;
  }

  return { open, messages, sending, error, suggestedCourts, send, reset };
});
