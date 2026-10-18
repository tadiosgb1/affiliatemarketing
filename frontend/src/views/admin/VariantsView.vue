<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '../../services/api'
import AdminPagination from '../../components/admin/AdminPagination.vue'

const products = ref([])
const attributes = ref([])
const showCreateForm = ref(false)
const createForm = ref({ productId: '', sku: '', barcode: '', price: '', compareAtPrice: '', costPrice: '', currency: 'ETB', weight: '', weightUnit: 'kg', length: '', width: '', height: '', dimensionUnit: 'cm' })
const variantOptions = ref({})
const selectedVariantImage = ref(null)
const variantImagePreview = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const search = ref('')
const statusFilter = ref('all')
const editingId = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const paginatedVariants = computed(() => visibleVariants.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const editForm = ref({ price: '', compareAtPrice: '', costPrice: '', status: 'active', barcode: '' })

const variants = computed(() => products.value.flatMap(product => (product.variants || []).map(variant => ({
  ...variant,
  productName: product.name,
  productSku: product.sku,
  productCurrency: product.currency || 'ETB',
  stock: (variant.inventory || []).reduce((sum, row) => sum + Number(row.quantityOnHand || 0), 0),
}))))
const visibleVariants = computed(() => variants.value.filter(variant => {
  const term = search.value.trim().toLowerCase()
  const status = String(variant.status || 'active').toLowerCase()
  return (statusFilter.value === 'all' || status === statusFilter.value) &&
    (!term || [variant.productName, variant.sku, variant.barcode, variant.productSku].some(value => String(value || '').toLowerCase().includes(term)))
}))
const formatMoney = (value, currency = 'ETB') => new Intl.NumberFormat(undefined, { style: 'currency', currency: /^[A-Z]{3}$/.test(currency || '') ? currency : 'ETB', maximumFractionDigits: 2 }).format(Number(value) || 0)
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [response, attributeResponse] = await Promise.all([api.get('/products/admin/all?limit=200'), api.get('/attributes')])
    products.value = Array.isArray(response.data?.data) ? response.data.data : []
    attributes.value = Array.isArray(attributeResponse.data?.data) ? attributeResponse.data.data : []
  } catch (err) {
    error.value = err.response?.data?.message || 'Product variants could not be loaded. Check your admin session and API connection.'
  } finally {
    loading.value = false
  }
}
function resetCreateForm() { createForm.value = { productId: '', sku: '', barcode: '', price: '', compareAtPrice: '', costPrice: '', currency: 'ETB', weight: '', weightUnit: 'kg', length: '', width: '', height: '', dimensionUnit: 'cm' }; variantOptions.value = {}; selectedVariantImage.value = null; variantImagePreview.value = '' }
function onVariantImageChange(event) { selectedVariantImage.value = event.target.files?.[0] || null; variantImagePreview.value = selectedVariantImage.value ? URL.createObjectURL(selectedVariantImage.value) : '' }
function cancelCreate() { showCreateForm.value = false; resetCreateForm() }
async function createVariant() {
  saving.value = true; error.value = ''; success.value = ''
  try {
    const product = products.value.find(item => item.id === createForm.value.productId)
    if (!product) throw new Error('Choose a product first.')
    const payload = { productId: product.id, sku: createForm.value.sku.trim(), barcode: createForm.value.barcode.trim() || null, price: Number(createForm.value.price), currency: createForm.value.currency || product.currency || 'ETB', compareAtPrice: createForm.value.compareAtPrice === '' ? null : Number(createForm.value.compareAtPrice), costPrice: createForm.value.costPrice === '' ? null : Number(createForm.value.costPrice), weight: createForm.value.weight === '' ? null : Number(createForm.value.weight), weightUnit: createForm.value.weightUnit, length: createForm.value.length === '' ? null : Number(createForm.value.length), width: createForm.value.width === '' ? null : Number(createForm.value.width), height: createForm.value.height === '' ? null : Number(createForm.value.height), dimensionUnit: createForm.value.dimensionUnit, options: Object.entries(variantOptions.value).filter(([, attributeValueId]) => attributeValueId).map(([attributeId, attributeValueId]) => ({ attributeId, attributeValueId })) }
    if (!payload.sku || !Number.isFinite(payload.price) || payload.price < 0) throw new Error('Enter a unique SKU and a valid selling price.')
    for (const value of [payload.weight, payload.length, payload.width, payload.height]) if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error('Weight and dimensions must be non-negative numbers.')
    for (const value of [payload.compareAtPrice, payload.costPrice]) if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error('All prices must be non-negative numbers.')
    const body = new FormData()
    Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined) body.append(key, key === 'options' ? JSON.stringify(value) : String(value)) })
    if (selectedVariantImage.value) body.append('image', selectedVariantImage.value)
    await api.post('/product-variants', body, { headers: { 'Content-Type': 'multipart/form-data' } })
    success.value = 'Product variant created.'; showCreateForm.value = false; resetCreateForm(); await load()
  } catch (err) { error.value = err.response?.data?.message || err.message || 'Could not create variant.' }
  finally { saving.value = false }
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
watch([search, statusFilter], () => { currentPage.value = 1 })
watch(() => createForm.value.productId, productId => { const product = products.value.find(item => item.id === productId); if (product) createForm.value.currency = product.currency || 'ETB' })
onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <p class="mb-3 text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Product variants</span></p>
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div></div>
      <div class="flex gap-2"><button type="button" class="h-10 border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50" :disabled="loading" @click="load">Refresh</button><button type="button" class="h-10 bg-indigo-600 px-3.5 text-[12px] font-semibold text-white hover:bg-indigo-700" @click="showCreateForm = !showCreateForm">{{ showCreateForm ? 'Cancel' : '+ New variant' }}</button></div>
    </header>
    <div v-if="error" role="alert" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">{{ error }}</div>
    <div v-if="success" role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{{ success }}</div>
    <form v-if="showCreateForm" class="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-3" @submit.prevent="createVariant"><div class="md:col-span-3"><label class="mb-1 block text-[12px] font-semibold">Product</label><select v-model="createForm.productId" required class="w-full"><option value="" disabled>Select product</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }} · {{ product.sku }}</option></select></div><div class="md:col-span-3"><label class="mb-1 block text-[12px] font-semibold">Variant image (optional)</label><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="w-full" @change="onVariantImageChange" /><img v-if="variantImagePreview" :src="variantImagePreview" alt="Variant image preview" class="mt-2 h-20 w-20 border object-cover" /></div><div><label class="mb-1 block text-[12px] font-semibold">Variant SKU</label><input v-model="createForm.sku" required maxlength="100" class="w-full" placeholder="e.g. TSHIRT-BLUE-M" /></div><div><label class="mb-1 block text-[12px] font-semibold">Barcode</label><input v-model="createForm.barcode" class="w-full" /></div><div><label class="mb-1 block text-[12px] font-semibold">Selling price</label><div class="flex gap-2"><input v-model="createForm.price" type="number" min="0" step="0.01" required class="min-w-0 flex-1" /><select v-model="createForm.currency" class="w-24"><option>ETB</option><option>USD</option><option>EUR</option><option>GBP</option><option>KES</option></select></div></div><div><label class="mb-1 block text-[12px] font-semibold">Compare-at price</label><input v-model="createForm.compareAtPrice" type="number" min="0" step="0.01" class="w-full" /></div><div><label class="mb-1 block text-[12px] font-semibold">Cost price</label><input v-model="createForm.costPrice" type="number" min="0" step="0.01" class="w-full" /></div><div><label class="mb-1 block text-[12px] font-semibold">Weight</label><div class="flex gap-2"><input v-model="createForm.weight" type="number" min="0" step="0.001" class="w-full" placeholder="Weight"/><select v-model="createForm.weightUnit" class="w-24"><option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option></select></div></div><div class="md:col-span-2"><label class="mb-1 block text-[12px] font-semibold">Dimensions</label><div class="flex flex-wrap gap-2"><input v-model="createForm.length" type="number" min="0" step="0.001" class="min-w-0 flex-1" placeholder="Length"/><input v-model="createForm.width" type="number" min="0" step="0.001" class="min-w-0 flex-1" placeholder="Width"/><input v-model="createForm.height" type="number" min="0" step="0.001" class="min-w-0 flex-1" placeholder="Height"/><select v-model="createForm.dimensionUnit" class="w-24"><option value="cm">cm</option><option value="mm">mm</option><option value="m">m</option><option value="in">in</option></select></div></div><div v-for="attribute in attributes.filter(item => item.type === 'select' || item.type === 'color')" :key="attribute.id"><label class="mb-1 block text-[12px] font-semibold">{{ attribute.name }}</label><select v-model="variantOptions[attribute.id]" class="w-full"><option value="">No selection</option><option v-for="option in attribute.values || []" :key="option.id" :value="option.id">{{ option.label || option.value }}</option></select></div><div class="flex justify-end gap-2 border-t border-slate-100 pt-4 md:col-span-3"><button type="button" class="h-9 border border-slate-200 px-3 text-[12px] font-semibold" @click="cancelCreate">Cancel</button><button type="submit" :disabled="saving" class="h-9 bg-indigo-600 px-4 text-[12px] font-semibold text-white disabled:opacity-50">{{ saving ? 'Saving…' : 'Create variant' }}</button></div></form>
    <div v-if="!showCreateForm" class="grid gap-3 sm:grid-cols-3"><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Variants</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ loading ? '—' : variants.length }}</p></article><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Active variants</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ loading ? '—' : variants.filter(item => item.status === 'active').length }}</p></article><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Visible variants</p><p class="mt-2 text-2xl font-bold text-slate-900">{{ loading ? '—' : visibleVariants.length }}</p></article></div>
    <div v-if="!showCreateForm" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-[13px] font-bold text-slate-900">Variant register</h3><p class="mt-1 text-[11px] text-slate-500">Prices are editable per variant; stock is read from inventory records.</p></div><div class="grid gap-2 sm:grid-cols-[minmax(200px,260px)_150px]"><input v-model="search" type="search" placeholder="Search product, SKU or barcode…" aria-label="Search variants" class="w-full" /><select v-model="statusFilter" aria-label="Filter variant status" class="w-full"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div>
      <div v-if="loading" class="space-y-3 p-5"><div v-for="n in 5" :key="n" class="h-12 animate-pulse rounded-md bg-slate-50"></div></div>
      <div v-else-if="!error && !visibleVariants.length" class="px-6 py-12 text-center"><p class="text-[13px] font-semibold text-slate-800">No variants found</p><p class="mt-1 text-[12px] text-slate-500">Create product variants from the product management workflow.</p></div>
      <div v-else-if="visibleVariants.length" class="overflow-x-auto"><table class="w-full min-w-[820px] text-left text-[12px]"><thead class="bg-slate-50/80 text-slate-500"><tr><th class="px-4 py-3">Product / SKU</th><th class="px-4 py-3">Barcode</th><th class="px-4 py-3">Selling price</th><th class="px-4 py-3">Cost price</th><th class="px-4 py-3">Stock</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Action</th></tr></thead><tbody>
        <template v-for="variant in paginatedVariants" :key="variant.id">
          <tr class="border-t border-slate-100 transition hover:bg-slate-50/70"><td class="px-4 py-3.5"><div class="flex items-center gap-2"><img v-if="variant.imageUrl || variant.media?.[0]?.asset?.storageUrl" :src="variant.imageUrl || variant.media?.[0]?.asset?.storageUrl" :alt="variant.sku" class="h-9 w-9 border object-cover" /><div><p class="font-semibold text-slate-900">{{ variant.productName }}</p><p class="mt-0.5 font-mono text-[10px] text-slate-400">{{ variant.sku }}</p></div></div></td><td class="px-4 py-3.5 font-mono text-[11px] text-slate-500">{{ variant.barcode || '—' }}</td><td class="px-4 py-3.5 font-semibold text-slate-900">{{ formatMoney(variant.price, variant.prices?.find(price => !price.validUntil)?.currency || variant.productCurrency) }}</td><td class="px-4 py-3.5 text-slate-600">{{ variant.costPrice == null ? '—' : formatMoney(variant.costPrice, variant.productCurrency) }}</td><td class="px-4 py-3.5 text-slate-600">{{ variant.stock }}</td><td class="px-4 py-3.5"><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" :class="variant.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ variant.status || 'active' }}</span></td><td class="px-4 py-3.5"><button type="button" class="rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50" @click="editingId === variant.id ? cancelEdit() : edit(variant)">{{ editingId === variant.id ? 'Cancel' : 'Edit variant' }}</button></td></tr>
          <tr v-if="editingId === variant.id" class="border-t border-indigo-100 bg-indigo-50/40"><td colspan="7" class="px-4 py-4"><form class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" @submit.prevent="saveVariant(variant)"><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Selling price</label><input v-model="editForm.price" type="number" min="0" step="0.01" required class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Compare-at price</label><input v-model="editForm.compareAtPrice" type="number" min="0" step="0.01" class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Cost price</label><input v-model="editForm.costPrice" type="number" min="0" step="0.01" class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Barcode</label><input v-model="editForm.barcode" class="w-full" /></div><div><label class="mb-1 block text-[11px] font-semibold text-slate-700">Status</label><select v-model="editForm.status" class="w-full"><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div class="flex items-end justify-end gap-2 sm:col-span-2 xl:col-span-5"><button type="button" class="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600" @click="cancelEdit">Cancel</button><button type="submit" :disabled="saving" class="h-9 rounded-lg bg-indigo-600 px-4 text-[12px] font-semibold text-white disabled:opacity-60">{{ saving ? 'Saving…' : 'Save variant' }}</button></div></form></td></tr>
        </template>
      </tbody></table></div>
      <AdminPagination v-if="!loading && visibleVariants.length && !editingId" v-model:page="currentPage" v-model:page-size="pageSize" :total="visibleVariants.length" />
      <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] text-slate-400">Variant records are read from product catalog data. Changes save through the product-variant API.</div>
    </div>
  </section>
</template>
