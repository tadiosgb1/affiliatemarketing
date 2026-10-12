<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../services/api'

const rows = ref([])
const warehouses = ref([])
const products = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = ref({ warehouseId: '', variantId: '', type: 'adjustment_in', quantity: 1, note: '' })
const showForm = ref(false)
const variants = computed(() => products.value.flatMap(product => (product.variants || []).map(variant => ({ ...variant, productName: product.name }))))

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [stockResponse, warehouseResponse, productResponse] = await Promise.all([
      api.get('/inventory'),
      api.get('/warehouses'),
      api.get('/products'),
    ])
    rows.value = stockResponse.data?.data ?? []
    warehouses.value = warehouseResponse.data?.data ?? warehouseResponse.data?.warehouses ?? []
    products.value = productResponse.data?.data ?? productResponse.data?.products ?? []
    if (!form.value.warehouseId && warehouses.value.length) form.value.warehouseId = warehouses.value[0].id
    if (!form.value.variantId && variants.value.length) form.value.variantId = variants.value[0].id
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load inventory. Check your management permissions and API connection.'
  } finally {
    loading.value = false
  }
}

async function adjustStock() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    if (!form.value.warehouseId || !form.value.variantId || !Number.isInteger(Number(form.value.quantity)) || Number(form.value.quantity) < 1) {
      throw new Error('Choose a warehouse and product variant, then enter a positive whole-number quantity.')
    }
    await api.post('/inventory/adjust', {
      warehouseId: form.value.warehouseId,
      variantId: form.value.variantId,
      type: form.value.type,
      quantity: Number(form.value.quantity),
      note: form.value.note.trim() || undefined,
    })
    success.value = 'Inventory adjustment saved.'
    showForm.value = false
    form.value.quantity = 1
    form.value.note = ''
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Could not adjust stock.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <p class="mb-3 text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Stock levels</span></p>
    <header class="flex items-center justify-between border-b border-slate-200 pb-3">
      <h1 class="text-sm font-semibold text-slate-800">Stock levels</h1>
      <div class="flex gap-2"><button class="h-9 border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700" @click="load">Refresh</button><button class="h-9 bg-indigo-600 px-3.5 text-[12px] font-semibold text-white" @click="showForm = !showForm">{{ showForm ? 'Cancel' : '+ Adjust stock' }}</button></div>
    </header>
    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{{ success }}</p>

    <form v-if="showForm" class="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-5" @submit.prevent="adjustStock">
      <div><label class="mb-1 block text-sm font-semibold">Warehouse</label><select v-model="form.warehouseId" required class="w-full rounded-xl border bg-white px-3 py-2.5"><option value="" disabled>Select warehouse</option><option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">{{ warehouse.name }} ({{ warehouse.code }})</option></select></div>
      <div><label class="mb-1 block text-sm font-semibold">Product variant</label><select v-model="form.variantId" required class="w-full rounded-xl border bg-white px-3 py-2.5"><option value="" disabled>Select variant</option><option v-for="variant in variants" :key="variant.id" :value="variant.id">{{ variant.productName }} · {{ variant.sku }}</option></select></div>
      <div><label class="mb-1 block text-sm font-semibold">Movement</label><select v-model="form.type" class="w-full rounded-xl border bg-white px-3 py-2.5"><option value="adjustment_in">Stock in</option><option value="adjustment_out">Stock out</option></select></div>
      <div><label class="mb-1 block text-sm font-semibold">Quantity</label><input v-model.number="form.quantity" type="number" min="1" step="1" required class="w-full rounded-xl border px-3 py-2.5"/></div>
      <div><label class="mb-1 block text-sm font-semibold">Note (optional)</label><input v-model="form.note" class="w-full rounded-xl border px-3 py-2.5" placeholder="Reason for adjustment"/></div>
      <div class="md:col-span-2 xl:col-span-5"><button type="submit" :disabled="saving || !warehouses.length || !variants.length" class="rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white disabled:opacity-50">{{ saving ? 'Saving…' : 'Save stock movement' }}</button><p v-if="!warehouses.length || !variants.length" class="mt-2 text-xs text-amber-700">You need at least one warehouse and one product variant before adjusting stock.</p></div>
    </form>

    <div class="overflow-hidden border border-slate-200 bg-white">
      <p v-if="loading" class="p-6 text-sm text-slate-500">Loading inventory…</p>
      <p v-else-if="!rows.length" class="p-6 text-sm text-slate-500">No stock records found yet.</p>
      <div v-else class="overflow-x-auto"><table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500"><tr><th class="px-4 py-3">Product</th><th class="p-4">SKU</th><th class="p-4">Warehouse</th><th class="p-4">On hand</th><th class="p-4">Reserved</th><th class="p-4">Reorder level</th><th class="p-4">Status</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.id" class="border-t border-slate-100 transition-colors hover:bg-slate-50/70"><td class="p-4 font-bold">{{ row.variant?.product?.name || 'Product' }}</td><td class="p-4 font-mono text-xs">{{ row.variant?.sku || '—' }}</td><td class="p-4">{{ row.warehouse?.name || '—' }}</td><td class="p-4 font-bold">{{ row.quantityOnHand }}</td><td class="p-4">{{ row.reservedQuantity || 0 }}</td><td class="p-4">{{ row.reorderLevel || 0 }}</td><td class="p-4"><span :class="Number(row.quantityOnHand) <= Number(row.reorderLevel || 0) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'" class="rounded-full px-2.5 py-1 text-xs font-bold">{{ Number(row.quantityOnHand) <= Number(row.reorderLevel || 0) ? 'Low stock' : 'In stock' }}</span></td></tr></tbody>
      </table></div>
    </div>
  </section>
</template>
