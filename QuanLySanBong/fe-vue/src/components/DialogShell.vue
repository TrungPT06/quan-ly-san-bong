<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

defineProps({ label: { type: String, required: true } });
const emit = defineEmits(["close"]);
const panel = ref(null);
let previous = null;

const focusable = () =>
  [...panel.value.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]")].filter((item) => item.offsetParent !== null);

function onKey(event) {
  if (event.key === "Escape") emit("close");
  if (event.key === "Tab") {
    const items = focusable();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}

onMounted(() => {
  previous = document.activeElement;
  focusable()[0]?.focus();
  document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  previous?.focus?.();
});
</script>

<template>
  <div
    ref="panel"
    role="dialog"
    aria-modal="true"
    :aria-label="label"
    class="club-dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <slot />
  </div>
</template>
