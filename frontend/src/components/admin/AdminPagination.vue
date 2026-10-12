<script setup>
import { computed } from 'vue'
const props = defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizes: { type: Array, default: () => [5, 10, 20, 50, 100] },
})
const emit = defineEmits(['update:page', 'update:pageSize'])
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const start = computed(() => props.total ? (props.page - 1) * props.pageSize + 1 : 0)
const end = computed(() => Math.min(props.page * props.pageSize, props.total))
function setSize(value) {
  emit('update:pageSize', Number(value))
  emit('update:page', 1)
}
</script>

<template>
  <div class="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 text-[12px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-2">
      <span>Show</span>
      <select :value="pageSize" aria-label="Rows per page" class="h-8 min-w-[68px] border border-slate-300 bg-white px-2 text-[12px]" @change="setSize($event.target.value)">
        <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
      </select>
      <span>per page</span>
      <span class="ml-2 text-slate-500">{{ start }}–{{ end }} of {{ total }}</span>
    </div>
    <div class="flex items-center gap-1">
      <button type="button" class="h-8 border border-slate-300 px-3 disabled:cursor-not-allowed disabled:opacity-40" :disabled="page <= 1" @click="emit('update:page', page - 1)">Previous</button>
      <span class="px-2 tabular-nums">Page {{ page }} of {{ pages }}</span>
      <button type="button" class="h-8 border border-slate-300 px-3 disabled:cursor-not-allowed disabled:opacity-40" :disabled="page >= pages" @click="emit('update:page', page + 1)">Next</button>
    </div>
  </div>
</template>
