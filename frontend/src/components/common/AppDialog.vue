<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  variant: { type: String, default: 'info', validator: value => ['info', 'success', 'warning', 'danger'].includes(value) },
  title: { type: String, default: 'Notice' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Cancel' },
  showCancel: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel', 'close'])
const styles = computed(() => ({
  info: { icon: 'i', iconClass: 'bg-sky-100 text-sky-700', actionClass: 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500' },
  success: { icon: '✓', iconClass: 'bg-emerald-100 text-emerald-700', actionClass: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' },
  warning: { icon: '!', iconClass: 'bg-amber-100 text-amber-800', actionClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' },
  danger: { icon: '×', iconClass: 'bg-red-100 text-red-700', actionClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' },
}[props.variant]))
function onKeydown(event) {
  if (event.key === 'Escape' && props.open && !props.busy) emit('close')
}
watch(() => props.open, value => {
  if (typeof window === 'undefined') return
  if (value) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" @click.self="!busy && emit('close')">
      <section role="dialog" aria-modal="true" :aria-label="title" class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div class="flex items-start gap-4">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold" :class="styles.iconClass" aria-hidden="true">{{ styles.icon }}</span>
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-bold text-slate-900">{{ title }}</h2>
            <p class="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{{ message }}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button v-if="showCancel" type="button" :disabled="busy" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" @click="emit('cancel')">{{ cancelText }}</button>
          <button type="button" :disabled="busy" class="rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50" :class="styles.actionClass" @click="emit('confirm')">{{ busy ? 'Please wait…' : confirmText }}</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
