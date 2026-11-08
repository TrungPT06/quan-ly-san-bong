<script setup>
import { ref } from "vue";

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  autocomplete: { type: String, default: "current-password" },
});
const model = defineModel({ type: String, required: true });
const visible = ref(false);
</script>

<template>
  <label class="club-form-label" :for="id">
    {{ label }}
    <div class="club-password">
      <input :id="id" v-model="model" required :type="visible ? 'text' : 'password'" :autocomplete="autocomplete" />
      <button type="button" :aria-label="`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`" :aria-pressed="visible" @click="visible = !visible">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          <path v-if="visible" d="m3 3 18 18" />
        </svg>
      </button>
    </div>
  </label>
</template>
