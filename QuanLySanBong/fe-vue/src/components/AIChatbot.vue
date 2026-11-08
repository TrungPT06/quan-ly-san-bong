<script setup>
import { nextTick, ref, watch } from "vue";
import { useChatStore } from "../stores/chat";
import { AI_CONFIGURED } from "../api/aiApi";

const chat = useChatStore();
const input = ref("");
const list = ref(null);
const suggestions = ["Gợi ý sân 5 người giá rẻ", "Có những cụm sân nào?", "Cách đặt sân như thế nào?"];

async function submit(text = input.value) {
  const value = text.trim();
  if (!value) return;
  input.value = "";
  await chat.send(value);
}

// Tự cuộn xuống tin nhắn mới nhất
watch(
  () => [chat.messages.length, chat.sending, chat.open],
  async () => {
    await nextTick();
    if (list.value) list.value.scrollTop = list.value.scrollHeight;
  },
);
</script>

<template>
  <div class="ai-chat">
    <section v-if="chat.open" class="ai-chat-panel" role="dialog" aria-label="Trợ lý AI tư vấn sân bóng">
      <header class="ai-chat-header">
        <div>
          <strong>Trợ lý AI</strong>
          <small>Tư vấn chọn sân &amp; đặt sân</small>
        </div>
        <div class="ai-chat-actions">
          <button type="button" title="Cuộc trò chuyện mới" aria-label="Cuộc trò chuyện mới" @click="chat.reset()">↺</button>
          <button type="button" aria-label="Đóng trợ lý AI" @click="chat.open = false">×</button>
        </div>
      </header>

      <div ref="list" class="ai-chat-list" aria-live="polite">
        <div v-for="message in chat.messages" :key="message.id" :class="['ai-msg', message.role]">{{ message.text }}</div>
        <div v-if="chat.sending" class="ai-msg assistant ai-typing" role="status">Đang suy nghĩ…</div>
        <p v-if="chat.error" class="ai-chat-error" role="alert">{{ chat.error }}</p>
        <p v-if="!AI_CONFIGURED" class="ai-chat-error">Chưa có VITE_AI_API_KEY trong file .env nên AI chưa trả lời được.</p>
        <div v-if="chat.suggestedCourts.length" class="ai-chips">
          <RouterLink v-for="court in chat.suggestedCourts" :key="court.id" :to="{ name: 'field-detail', params: { id: court.id } }" @click="chat.open = false">
            Xem {{ court.tenSan }} →
          </RouterLink>
        </div>
      </div>

      <div v-if="chat.messages.length === 1" class="ai-chips ai-suggest">
        <button v-for="text in suggestions" :key="text" type="button" @click="submit(text)">{{ text }}</button>
      </div>

      <form class="ai-chat-form" @submit.prevent="submit()">
        <input v-model="input" type="text" maxlength="400" placeholder="Hỏi về sân, giá, khung giờ…" aria-label="Nội dung câu hỏi" :disabled="chat.sending" />
        <button type="submit" :disabled="chat.sending || !input.trim()">Gửi</button>
      </form>
    </section>

    <button v-if="!chat.open" type="button" class="ai-chat-fab" aria-label="Mở trợ lý AI tư vấn" @click="chat.open = true">
      <span aria-hidden="true">✦</span> Tư vấn AI
    </button>
  </div>
</template>

<style scoped>
.ai-chat { position: fixed; right: 20px; bottom: 20px; z-index: 60; font-family: inherit; }
.ai-chat-fab { background: #da1a32; color: #fff; border: 0; border-radius: 999px; padding: 13px 20px; font-weight: 800; font-size: 14px; box-shadow: 0 10px 28px rgba(218, 26, 50, 0.35); cursor: pointer; }
.ai-chat-fab:hover { background: #b51228; }
.ai-chat-panel { width: min(380px, calc(100vw - 24px)); height: min(560px, calc(100vh - 96px)); background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 24px 60px rgba(11, 15, 20, 0.28); display: flex; flex-direction: column; overflow: hidden; }
.ai-chat-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #0b0f14; color: #fff; }
.ai-chat-header strong { display: block; font-size: 15px; }
.ai-chat-header small { color: #b9c4d2; font-size: 11px; }
.ai-chat-actions button { background: transparent; border: 0; color: #fff; font-size: 20px; width: 34px; height: 34px; cursor: pointer; border-radius: 8px; }
.ai-chat-actions button:hover { background: rgba(255, 255, 255, 0.12); }
.ai-chat-list { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: #f8f9fb; }
.ai-msg { max-width: 86%; padding: 10px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.ai-msg.assistant { background: #fff; border: 1px solid #e5e7eb; align-self: flex-start; color: #0b0f14; }
.ai-msg.user { background: #da1a32; color: #fff; align-self: flex-end; }
.ai-typing { color: #64748b; font-style: italic; }
.ai-chat-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 8px 10px; font-size: 12px; }
.ai-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.ai-chips a, .ai-chips button { background: #fff0f2; color: #b51228; border: 1px solid #ffd3d9; border-radius: 999px; padding: 6px 11px; font-size: 12px; font-weight: 700; text-decoration: none; cursor: pointer; }
.ai-suggest { padding: 0 14px 10px; background: #f8f9fb; }
.ai-chat-form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e5e7eb; background: #fff; }
.ai-chat-form input { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; font-size: 13.5px; outline: none; }
.ai-chat-form input:focus { border-color: #da1a32; box-shadow: 0 0 0 3px rgba(218, 26, 50, 0.1); }
.ai-chat-form button { background: #da1a32; color: #fff; border: 0; border-radius: 10px; padding: 0 16px; font-weight: 800; cursor: pointer; }
.ai-chat-form button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
