<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../services/api'

const attributes = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)
const selected = ref(null)
const form = ref({ name: '', type: 'select', dataType: 'text', unit: '', isFilterable: true, isRequired: false, valuesText: '' })
const valueForm = ref({ value: '', label: '' })
const search = ref('')
const visible = computed(() => attributes.value.filter(a => (a.name || '').toLowerCase().includes(search.value.toLowerCase())))

async function load() {
  loading.value = true; error.value = ''
  try {
    const r = await api.get('/attributes')
    attributes.value = Array.isArray(r.data?.data) ? r.data.data : []
  } catch (e) { error.value = e.response?.data?.message || 'Could not load attributes.' }
  finally { loading.value = false }
}
function reset() { form.value = { name: '', type: 'select', dataType: 'text', unit: '', isFilterable: true, isRequired: false, valuesText: '' } }
async function createAttribute() {
  saving.value = true; error.value = ''; success.value = ''
  try {
    const values = form.value.valuesText.split(',').map(x => x.trim()).filter(Boolean).map(value => ({ value, label: value }))
    const payload = { name: form.value.name.trim(), type: form.value.type, dataType: form.value.dataType, unit: form.value.unit.trim() || null, isFilterable: form.value.isFilterable, isRequired: form.value.isRequired, values }
    await api.post('/attributes', payload)
    success.value = 'Attribute created.'
    showForm.value = false; reset(); await load()
  } catch (e) { error.value = e.response?.data?.message || 'Could not create attribute.' }
  finally { saving.value = false }
}
function manageValues(attribute) { selected.value = attribute; valueForm.value = { value: '', label: '' }; error.value = ''; success.value = '' }
async function addValue() {
  if (!selected.value || !valueForm.value.value.trim()) return
  saving.value = true; error.value = ''; success.value = ''
  try {
    await api.post('/attributes/' + selected.value.id + '/values', { value: valueForm.value.value.trim(), label: valueForm.value.label.trim() || valueForm.value.value.trim() })
    success.value = 'Attribute value added.'
    valueForm.value = { value: '', label: '' }; await load()
    selected.value = attributes.value.find(a => a.id === selected.value?.id) || selected.value
  } catch (e) { error.value = e.response?.data?.message || 'Could not add value.' }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
      <div><p class="text-xs text-slate-500">Catalog / Attributes</p><h1 class="mt-1 text-xl font-bold">Attribute & value management</h1><p class="mt-1 text-sm text-slate-500">Create reusable, market-independent product properties and their selectable values.</p></div>
      <button class="bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" @click="showForm = !showForm">{{ showForm ? 'Cancel' : '+ New attribute' }}</button>
    </header>
    <p v-if="error" role="alert" class="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{{ success }}</p>
    <form v-if="showForm" class="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-2" @submit.prevent="createAttribute">
      <label class="text-sm font-semibold">Attribute name<input v-model="form.name" required maxlength="120" class="mt-1 w-full rounded border p-2.5" placeholder="Color, Size, Material, Capacity…" /></label>
      <label class="text-sm font-semibold">Input type<select v-model="form.type" class="mt-1 w-full rounded border bg-white p-2.5"><option value="select">Selectable options</option><option value="text">Text</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="color">Color</option></select></label>
      <label class="text-sm font-semibold">Data type<select v-model="form.dataType" class="mt-1 w-full rounded border bg-white p-2.5"><option value="text">Text</option><option value="number">Number</option><option value="boolean">Boolean</option><option value="date">Date</option><option value="json">JSON</option></select></label>
      <label class="text-sm font-semibold">Unit (optional)<input v-model="form.unit" class="mt-1 w-full rounded border p-2.5" placeholder="cm, kg, GB, inch…" /></label>
      <label class="flex items-center gap-2 text-sm"><input v-model="form.isFilterable" type="checkbox" /> Available as a storefront filter</label>
      <label class="flex items-center gap-2 text-sm"><input v-model="form.isRequired" type="checkbox" /> Required for products</label>
      <label class="md:col-span-2 text-sm font-semibold">Initial values (comma-separated)<input v-model="form.valuesText" class="mt-1 w-full rounded border p-2.5" placeholder="Black, White, Blue" /><span class="mt-1 block font-normal text-slate-500">For example, create a Color attribute with Black, White, and Blue values. You can add more values later.</span></label>
      <div class="md:col-span-2"><button :disabled="saving" class="bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{{ saving ? 'Saving…' : 'Create attribute' }}</button></div>
    </form>
    <div class="flex flex-wrap items-center justify-between gap-3"><input v-model="search" class="w-full max-w-sm rounded border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="Search attributes…" /><span class="text-sm text-slate-500">{{ visible.length }} attributes</span></div>
    <div class="overflow-x-auto border border-slate-200 bg-white">
      <table class="w-full text-left text-sm"><thead class="bg-slate-50 text-slate-500"><tr><th class="p-3">Attribute</th><th class="p-3">Type / unit</th><th class="p-3">Values</th><th class="p-3">Settings</th><th class="p-3">Manage</th></tr></thead>
      <tbody><tr v-if="loading"><td colspan="5" class="p-5 text-slate-500">Loading…</td></tr><tr v-else-if="!visible.length"><td colspan="5" class="p-5 text-slate-500">No attributes found. Create an attribute to get started.</td></tr>
      <tr v-for="a in visible" :key="a.id" class="border-t border-slate-100"><td class="p-3 font-semibold">{{ a.name }}</td><td class="p-3">{{ a.type }} · {{ a.dataType }}<span v-if="a.unit"> ({{ a.unit }})</span></td><td class="p-3"><div class="flex flex-wrap gap-1"><span v-for="v in (a.values || [])" :key="v.id" class="rounded bg-slate-100 px-2 py-1 text-xs">{{ v.label || v.value }}</span><span v-if="!a.values?.length" class="text-slate-400">No values</span></div></td><td class="p-3 text-xs text-slate-600">{{ a.isFilterable ? 'Filterable' : 'Not filterable' }} · {{ a.isRequired ? 'Required' : 'Optional' }}</td><td class="p-3"><button class="font-semibold text-indigo-600" @click="manageValues(a)">Manage values</button></td></tr></tbody></table>
    </div>
    <div v-if="selected" class="space-y-4 border border-indigo-200 bg-white p-5">
      <div class="flex items-start justify-between gap-3"><div><h2 class="font-bold">Values for {{ selected.name }}</h2><p class="text-sm text-slate-500">Add options used for product attributes and variant selections.</p></div><button class="text-sm text-slate-500" @click="selected = null">Close</button></div>
      <div class="flex flex-col gap-3 sm:flex-row"><input v-model="valueForm.value" required class="min-w-0 flex-1 rounded border p-2.5" placeholder="Stored value (e.g. black)" /><input v-model="valueForm.label" class="min-w-0 flex-1 rounded border p-2.5" placeholder="Display label (e.g. Black)" /><button :disabled="saving || !valueForm.value.trim()" class="bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="addValue">Add value</button></div>
      <div class="flex flex-wrap gap-2"><span v-for="v in (selected.values || [])" :key="v.id" class="rounded border border-slate-200 px-3 py-2 text-sm">{{ v.label || v.value }} <span class="text-slate-400">({{ v.value }})</span></span></div>
    </div>
  </section>
</template>
