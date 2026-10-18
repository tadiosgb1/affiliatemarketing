<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '../../services/api'

const makes = ref([])
const products = ref([])
const fitments = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const makeForm = ref({ name: '' })
const modelForm = ref({ makeId: '', name: '' })
const generationForm = ref({ modelId: '', generationName: '', yearFrom: '', yearTo: '', bodyStyle: '' })
const fitmentForm = ref({ productId: '', vehicleGenerationId: '', notes: '' })
const models = computed(() => makes.value.flatMap(make => (make.models || []).map(model => ({ ...model, makeName: make.name }))))
const generations = computed(() => models.value.flatMap(model => (model.generations || []).map(generation => ({ ...generation, modelName: model.name, makeName: model.makeName }))))
const selectedProduct = computed(() => products.value.find(product => product.id === fitmentForm.value.productId))
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [vehicleResponse, productResponse] = await Promise.all([
      api.get('/vehicle-catalog/makes'),
      api.get('/products/admin/all?limit=200'),
    ])
    makes.value = vehicleResponse.data?.data || []
    products.value = productResponse.data?.data || []
    if (fitmentForm.value.productId) await loadFitments()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load vehicle catalog.'
  } finally { loading.value = false }
}
async function loadFitments() {
  if (!fitmentForm.value.productId) { fitments.value = []; return }
  const response = await api.get('/vehicle-catalog/products/' + fitmentForm.value.productId + '/fitments')
  fitments.value = response.data?.data || []
}
async function submit(action, payload) {
  saving.value = true; error.value = ''; success.value = ''
  try {
    await action(payload)
    success.value = 'Vehicle catalog saved.'
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Could not save vehicle catalog data.'
  } finally { saving.value = false }
}
function createMake() {
  if (!makeForm.value.name.trim()) return
  return submit(payload => api.post('/vehicle-catalog/makes', payload), { name: makeForm.value.name.trim() }).then(() => { makeForm.value.name = '' })
}
function createModel() {
  return submit(payload => api.post('/vehicle-catalog/models', payload), { makeId: modelForm.value.makeId, name: modelForm.value.name.trim() }).then(() => { modelForm.value.name = '' })
}
function createGeneration() {
  const payload = { ...generationForm.value, yearFrom: generationForm.value.yearFrom || null, yearTo: generationForm.value.yearTo || null }
  return submit(data => api.post('/vehicle-catalog/generations', data), payload).then(() => { generationForm.value = { modelId: '', generationName: '', yearFrom: '', yearTo: '', bodyStyle: '' } })
}
async function addFitment() {
  if (!fitmentForm.value.productId || !fitmentForm.value.vehicleGenerationId) return
  await submit(data => api.post('/vehicle-catalog/products/' + data.productId + '/fitments', data), {
    productId: fitmentForm.value.productId,
    vehicleGenerationId: fitmentForm.value.vehicleGenerationId,
    notes: fitmentForm.value.notes,
  })
  fitmentForm.value.notes = ''
}
async function removeFitment(row) {
  saving.value = true; error.value = ''; success.value = ''
  try {
    await api.delete('/vehicle-catalog/products/' + fitmentForm.value.productId + '/fitments/' + row.vehicleGenerationId)
    success.value = 'Vehicle compatibility removed.'
    await loadFitments()
  } catch (err) { error.value = err.response?.data?.message || 'Could not remove vehicle compatibility.' }
  finally { saving.value = false }
}
watch(() => fitmentForm.value.productId, () => loadFitments().catch(err => { error.value = err.response?.data?.message || 'Could not load product fitments.' }))
onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[12px] text-slate-500">Home / Catalog / Vehicle catalog</p><h1 class="mt-1 text-xl font-bold text-slate-900">Vehicle compatibility</h1><p class="mt-1 text-sm text-slate-500">Manage makes, models, generations and fitment for automotive products.</p></div>
      <button type="button" class="h-9 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" @click="load">Refresh</button>
    </header>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{{ success }}</p>
    <p v-if="loading" class="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading vehicle catalog…</p>
    <div class="grid gap-4 lg:grid-cols-3">
      <form class="space-y-3 border border-slate-200 bg-white p-4" @submit.prevent="createMake"><h2 class="font-bold text-slate-900">1. Vehicle make</h2><label class="block text-xs font-semibold">Make name<input v-model="makeForm.name" required class="mt-1 w-full" placeholder="Toyota" /></label><button :disabled="saving" class="bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add make</button></form>
      <form class="space-y-3 border border-slate-200 bg-white p-4" @submit.prevent="createModel"><h2 class="font-bold text-slate-900">2. Vehicle model</h2><label class="block text-xs font-semibold">Make<select v-model="modelForm.makeId" required class="mt-1 w-full"><option value="">Choose make</option><option v-for="make in makes" :key="make.id" :value="make.id">{{ make.name }}</option></select></label><label class="block text-xs font-semibold">Model name<input v-model="modelForm.name" required class="mt-1 w-full" placeholder="Corolla" /></label><button :disabled="saving" class="bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add model</button></form>
      <form class="space-y-3 border border-slate-200 bg-white p-4" @submit.prevent="createGeneration"><h2 class="font-bold text-slate-900">3. Generation</h2><label class="block text-xs font-semibold">Model<select v-model="generationForm.modelId" required class="mt-1 w-full"><option value="">Choose model</option><option v-for="model in models" :key="model.id" :value="model.id">{{ model.makeName }} · {{ model.name }}</option></select></label><label class="block text-xs font-semibold">Generation / trim<input v-model="generationForm.generationName" class="mt-1 w-full" placeholder="E210" /></label><div class="grid grid-cols-2 gap-2"><label class="block text-xs font-semibold">Year from<input v-model="generationForm.yearFrom" type="number" min="1886" max="2200" class="mt-1 w-full" /></label><label class="block text-xs font-semibold">Year to<input v-model="generationForm.yearTo" type="number" min="1886" max="2200" class="mt-1 w-full" /></label></div><label class="block text-xs font-semibold">Body style<input v-model="generationForm.bodyStyle" class="mt-1 w-full" placeholder="Sedan, SUV…" /></label><button :disabled="saving" class="bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add generation</button></form>
    </div>
    <section class="space-y-4 border border-slate-200 bg-white p-4">
      <div><h2 class="font-bold text-slate-900">Product fitment</h2><p class="mt-1 text-sm text-slate-500">Connect a car part or vehicle product to the compatible generation(s).</p></div>
      <form class="grid gap-3 md:grid-cols-3" @submit.prevent="addFitment"><label class="block text-xs font-semibold">Product<select v-model="fitmentForm.productId" required class="mt-1 w-full"><option value="">Choose product</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option></select></label><label class="block text-xs font-semibold">Vehicle generation<select v-model="fitmentForm.vehicleGenerationId" required class="mt-1 w-full"><option value="">Choose generation</option><option v-for="generation in generations" :key="generation.id" :value="generation.id">{{ generation.makeName }} {{ generation.modelName }} · {{ generation.generationName || 'Generation' }} {{ generation.yearFrom || '' }}–{{ generation.yearTo || 'present' }}</option></select></label><label class="block text-xs font-semibold">Fitment notes<input v-model="fitmentForm.notes" class="mt-1 w-full" placeholder="Engine, trim or installation notes" /></label><div class="md:col-span-3"><button :disabled="saving || !fitmentForm.productId || !fitmentForm.vehicleGenerationId" class="bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Link compatibility</button></div></form>
      <div v-if="fitmentForm.productId" class="overflow-x-auto"><h3 class="mb-2 text-sm font-semibold">{{ selectedProduct?.name || 'Selected product' }} compatible vehicles</h3><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-slate-500"><tr><th class="p-3">Vehicle</th><th class="p-3">Years / body</th><th class="p-3">Notes</th><th class="p-3">Action</th></tr></thead><tbody><tr v-for="row in fitments" :key="row.vehicleGenerationId" class="border-t border-slate-100"><td class="p-3">{{ row.generation?.model?.make?.name }} {{ row.generation?.model?.name }} {{ row.generation?.generationName }}</td><td class="p-3">{{ row.generation?.yearFrom || '—' }}–{{ row.generation?.yearTo || 'present' }} · {{ row.generation?.bodyStyle || '—' }}</td><td class="p-3">{{ row.notes || '—' }}</td><td class="p-3"><button type="button" :disabled="saving" class="font-semibold text-red-600 disabled:opacity-50" @click="removeFitment(row)">Remove</button></td></tr><tr v-if="!fitments.length"><td colspan="4" class="p-4 text-slate-500">No vehicle compatibility assigned yet.</td></tr></tbody></table></div>
    </section>
  </section>
</template>
