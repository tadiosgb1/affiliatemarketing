<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../services/api'

const products = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const search = ref('')
const statusFilter = ref('all')
const editingId = ref('')
const editForm = ref({ price: '', compareAtPrice: '', costPrice: '', status: 'active', barcode: '' })

const variants = computed(() => products.value.flatMap(product => (product.variants || []).map(variant => ({
  ...variant,
  productName: product.name,
  productSku: product.sku,
  stock: (variant.inventory || []).reduce((sum, row) => sum + Number(row.quantityOnHand || 0), 0),
}))))
const visibleVariants = computed(() => variants.value.filter(variant => {
  const term = search.value.trim().toLowerCase()
  const status = String(variant.status || 'active').toLowerCase()
  return (statusFilter.value === 'all' || status === statusFilter.value) &&
    (!term || [variant.productName, variant.sku, variant.barcode, variant.productSku].some(value => String(value || '').toLowerCase().includes(term)))
}))
const formatMoney = value => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 }).format(Number(value) || 0)
async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/products/admin/all')
    products.value = Array.isArray(response.data?.data) ? response.data.data : []
  } catch (err) {
    error.value = err.response?.data?.message || 'Product variants could not be loaded. Check your admin session and API connection.'
  } finally {
    loading.value = false
  }
}
function edit(variant) {
  editingId.value = variant.id
  editForm.value = {
    price: variant.price ?? '',
    compareAtPrice: variant.compareAtPrice ?? '',
    costPrice: variant.costPrice ?? '',
    status: variant.status || 'active',
    barcode: variant.barcode || '',
  }
  error.value = ''
  success.value = ''
}
function cancelEdit() { editingId.value = '' }
async function saveVariant(variant) {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const payload = {
      price: editForm.value.price === '' ? null : Number(editForm.value.price),
      compareAtPrice: editForm.value.compareAtPrice === '' ? null : Number(editForm.value.compareAtPrice),
      costPrice: editForm.value.costPrice === '' ? null : Number(editForm.value.costPrice),
      status: editForm.value.status,
      barcode: editForm.value.barcode.trim() || null,
    }
    if (Object.values(payload).some(value => typeof value === 'number' && (!Number.isFinite(value) || value < 0))) throw new Error('Prices must be valid non-negative numbers.')
    const response = await api.patch('/product-variants/' + variant.id, payload)
    Object.assign(variant, response.data?.data || payload)
    success.value = 'Variant updated successfully.'
    editingId.value = ''
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Could not update this variant.'
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="text-[11px] font-bold uppercase tracking-[.15em] text-indigo-600">Catalog management</p><h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">Product variants</h2><p class="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">Manage variant-level pricing, barcodes and publication status for each product option.</p></div>
      <button type="button" class="h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50" :disabled="loading" @click="load">↻ Refresh variants</button>
    </header>
    <div v-if="error" role="alert" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">{{ error }}</div>
    <div v-if="success" role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{{ success }}</div>
    <div class="grid gap-3 sm:grid-cols-3"><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Variants</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ loading ? '—' : variants.length }}</p></article><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Active variants</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ loading ? '—' : variants.filter(item => item.status === 'active').length }}</p></article><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Visible variants</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ loading ? '—' : visibleVariants.length }}</p></article></div>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-[13px] font-bold text-slate-900">Variant register</h3><p class="mt-1 text-[11px] text-slate-500">Prices are editable per variant; stock is read from inventory records.</p></div><div class="grid gap-2 sm:grid-cols-[minmax(200px,260px)_150px]"><input v-model="search" type="search" placeholder="Search product, SKU or barcode…" aria-label="Search variants" class="w-full" /><select v-model="statusFilter" aria-label="Filter variant status" class="w-full"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
      <div v-if="loading" class="space-y-3 p-5"><div v-for="n in 5" :key="n" class="h-12 animate-pulse rounded-md bg-slate-50"></div></div>
      <div v-else-if="!error && !visibleVariants.length" class="px-6 py-12 text-center"><p class="text-[13px] font-semibold text-slate-800">No variants found</p><p class="mt-1 text-[12px] text-slate-500">Create product variants from the product management workflow.</p></div>
      <div v-else-if="visibleVariants.length" class="overflow-x-auto"><table class="w-full min-w-[820px] text-left text-[12px]"><thead class="bg-slate-50/80 text-slate-500"><tr><th class="px-4 py-3">Product / SKU</th><th class="px-4 py-3">Barcode</th><th class="px-4 py-3">Selling price</th><th class="px-4 py-3">Cost price</th><th class="px-4 py-3">Stock</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Action</th></tr></thead><tbody>
        <template v-for="variant in visibleVariants" :key="variant.id">
          <tr class="border-t border-slate-100 transition hover:bg-slate-50/70"><td class="px-4 py-3.5"><p class="font-semibold text-slate-900">{{ variant.productName }}</p><p class="mt-0.5 font-mono text-[10px] text-slate-400">{{ variant.sku }}</p></td><td class="px-4 py-3.5 font-mono text-[11px] text-slate-500">{{ variant.barcode || '—' }}</td><td class="px-4 py-3.5 font-semibold text-slate-900">{{ formatMoney(variant.price) }}</td><td class="px-4 py-3.5 text-slate-600">{{ variant.costPrice == null ? '—' : formatMoney(variant.costPrice) }}</td><td class="px-4 py-3.5 text-slate-600">{{ variant.stock }}</td><td class="px-4 py-3.5"><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" :class="variant.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ variant.status || 'active' }}</span></td><td class="px-4 py-3.5"><button type="button" class="rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" @click="editingId === variant.id ? cancelEdit() : edit(variant)">{{ editingId === variant.id ? 'Cancel' : 'Edit variant' }}</button></td></tr>
          <tr v-if="editingId === variant.id" class="border-t border-indigo-100 bg-indigo-50/40"><td colspan="7" class="px-4 py-4"><form class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" @submit.prevent="saveVariant(variant)"><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Selling price</label><input v-model="editForm.price" type="number" min="0" step="0.01" required class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Compare-at price</label><input v-model="editForm.compareAtPrice" type="number" min="0" step="0.01" class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Cost price</label><input v-model="editForm.costPrice" type="number" min="0" step="0.01" class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Barcode</label><input v-model="editForm.barcode" class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Status</label><select v-model="editForm.status" class="w-full"><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div class="flex items-end justify-end gap-2 sm:col-span-2 xl:col-span-5"><button type="button" class="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600" @click="cancelEdit">Cancel</button><button type="submit" :disabled="saving" class="h-9 rounded-lg bg-indigo-600 px-4 text-[12px] font-semibold text-white disabled:opacity-60">{{ saving ? 'Saving…' : 'Save variant' }}</button></div></form></td></tr>
        </template>
      </tbody></table></div>
      <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] text-slate-400">Variant records are read from product catalog data. Changes save through the product-variant API.</div>
    </div>
  </section>
</template>
