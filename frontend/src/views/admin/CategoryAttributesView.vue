<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '../../services/api'

const categories = ref([])
const attributes = ref([])
const selectedCategoryId = ref('')
const assigned = ref([])
const selectedAttributeId = ref('')
const isRequired = ref(false)
const isVariant = ref(false)
const sortOrder = ref(0)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const selectedCategory = computed(() => categories.value.find(c => c.id === selectedCategoryId.value))
const assignedIds = computed(() => new Set(assigned.value.map(row => row.attributeId)))

async function loadBase() {
  loading.value = true; error.value = ''
  try {
    const [c, a] = await Promise.all([api.get('/categories'), api.get('/attributes')])
    categories.value = c.data?.data || []
    attributes.value = a.data?.data || []
    if (!selectedCategoryId.value && categories.value.length) selectedCategoryId.value = categories.value[0].id
  } catch (e) { error.value = e.response?.data?.message || 'Could not load categories and attributes.' }
  finally { loading.value = false }
}
async function loadAssigned() {
  if (!selectedCategoryId.value) { assigned.value = []; return }
  try {
    const r = await api.get('/attributes/categories/' + selectedCategoryId.value)
    assigned.value = Array.isArray(r.data?.data) ? r.data.data : []
  } catch (e) { error.value = e.response?.data?.message || 'Could not load category attribute rules.' }
}
async function assign() {
  if (!selectedCategoryId.value || !selectedAttributeId.value) return
  saving.value = true; error.value = ''; success.value = ''
  try {
    await api.post('/attributes/categories/' + selectedCategoryId.value, { attributeId: selectedAttributeId.value, isRequired: isRequired.value, isVariant: isVariant.value, sortOrder: Number(sortOrder.value) || 0 })
    success.value = 'Attribute assigned to category.'
    selectedAttributeId.value = ''; isRequired.value = false; isVariant.value = false; sortOrder.value = 0
    await loadAssigned()
  } catch (e) { error.value = e.response?.data?.message || 'Could not assign attribute.' }
  finally { saving.value = false }
}
watch(selectedCategoryId, loadAssigned)
onMounted(loadBase)
</script>

<template>
  <section class="space-y-5">
    <header class="border-b border-slate-200 pb-4"><p class="text-xs text-slate-500">Catalog / Category attributes</p><h1 class="mt-1 text-xl font-bold">Category attribute rules</h1><p class="mt-1 text-sm text-slate-500">Choose which reusable attributes apply to each category and whether they are required or used to define variants.</p></header>
    <p v-if="error" role="alert" class="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p><p v-if="success" role="status" class="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{{ success }}</p>
    <div v-if="loading" class="border bg-white p-5 text-sm text-slate-500">Loading catalog settings…</div>
    <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div class="space-y-4 border border-slate-200 bg-white p-5">
        <h2 class="font-bold">Assign an attribute</h2>
        <label class="block text-sm font-semibold">Category<select v-model="selectedCategoryId" class="mt-1 w-full rounded border bg-white p-2.5"><option value="" disabled>Select category</option><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.parentId ? '— ' : '' }}{{ c.name }}</option></select></label>
        <label class="block text-sm font-semibold">Attribute<select v-model="selectedAttributeId" class="mt-1 w-full rounded border bg-white p-2.5"><option value="" disabled>Select attribute</option><option v-for="a in attributes.filter(a => !assignedIds.has(a.id))" :key="a.id" :value="a.id">{{ a.name }} · {{ a.type }}</option></select></label>
        <label class="flex items-center gap-2 text-sm"><input v-model="isRequired" type="checkbox" /> Required for this category</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="isVariant" type="checkbox" /> Use as a variant option (e.g. size or color)</label>
        <label class="block text-sm font-semibold">Display order<input v-model.number="sortOrder" type="number" min="0" class="mt-1 w-full rounded border p-2.5" /></label>
        <button :disabled="saving || !selectedCategoryId || !selectedAttributeId" class="bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="assign">{{ saving ? 'Saving…' : 'Assign attribute' }}</button>
        <p v-if="!categories.length" class="text-sm text-amber-700">Create a category first.</p><p v-if="!attributes.length" class="text-sm text-amber-700">Create attributes first.</p>
      </div>
      <div class="border border-slate-200 bg-white">
        <div class="border-b border-slate-200 p-5"><h2 class="font-bold">Attributes assigned to {{ selectedCategory?.name || 'category' }}</h2><p class="mt-1 text-sm text-slate-500">The saved rules are returned by the category-attributes API.</p></div>
        <div v-if="!assigned.length" class="p-5 text-sm text-slate-500">No attributes assigned to this category yet.</div>
        <div v-for="rule in assigned" :key="rule.id" class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 last:border-0"><div><p class="font-semibold">{{ rule.attribute?.name || 'Attribute' }}</p><p class="mt-1 text-xs text-slate-500">{{ rule.attribute?.type }} · {{ (rule.attribute?.values || []).map(v => v.label || v.value).join(', ') || 'No selectable values' }}</p></div><div class="flex flex-wrap gap-2 text-xs"><span class="rounded bg-slate-100 px-2 py-1">{{ rule.isRequired ? 'Required' : 'Optional' }}</span><span class="rounded bg-slate-100 px-2 py-1">{{ rule.isVariant ? 'Variant option' : 'Product detail' }}</span><span class="rounded bg-slate-100 px-2 py-1">Order {{ rule.sortOrder }}</span></div></div>
      </div>
    </div>
  </section>
</template>
