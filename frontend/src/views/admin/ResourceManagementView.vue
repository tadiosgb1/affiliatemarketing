<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const rows = ref([])
const products = ref([])
const suppliers = ref([])
const showForm = ref(false)
const search = ref('')
const form = ref({})

const resources = {
  brands: {
    title: 'Brands', group: 'Catalog', endpoint: '/brands', description: 'Maintain the brands shown across your product catalog.',
    fields: [
      { key: 'name', label: 'Brand name', required: true, placeholder: 'e.g. Northstar' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short brand overview' },
      { key: 'logoUrl', label: 'Logo URL', placeholder: 'https://…' },
    ],
    columns: [{ key: 'name', label: 'Brand' }, { key: 'description', label: 'Description' }, { key: 'isActive', label: 'Status', kind: 'active' }],
    searchKeys: ['name', 'description'],
  },
  attributes: {
    title: 'Product attributes', group: 'Catalog', endpoint: '/attributes', description: 'Define reusable product options such as size, colour, material and capacity.',
    fields: [
      { key: 'name', label: 'Attribute name', required: true, placeholder: 'e.g. Colour' },
      { key: 'type', label: 'Value type', type: 'select', options: [{ label: 'Selectable options', value: 'select' }, { label: 'Text', value: 'text' }, { label: 'Number', value: 'number' }, { label: 'Boolean', value: 'boolean' }, { label: 'Colour', value: 'color' }] },
      { key: 'valuesText', label: 'Options (comma-separated)', placeholder: 'Black, White, Blue' },
    ],
    columns: [{ key: 'name', label: 'Attribute' }, { key: 'type', label: 'Type' }, { key: 'values', label: 'Options', kind: 'values' }],
    searchKeys: ['name', 'type'],
  },
  warehouses: {
    title: 'Warehouses', group: 'Inventory', endpoint: '/warehouses', description: 'Manage the physical locations used for stock and inventory movements.',
    fields: [
      { key: 'code', label: 'Warehouse code', required: true, placeholder: 'e.g. ADD-01' },
      { key: 'name', label: 'Warehouse name', required: true, placeholder: 'Main warehouse' },
      { key: 'city', label: 'City', placeholder: 'Addis Ababa' },
      { key: 'phone', label: 'Phone', placeholder: '+251…' },
      { key: 'managerName', label: 'Manager name', placeholder: 'Warehouse manager' },
      { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Street or location details' },
    ],
    columns: [{ key: 'name', label: 'Warehouse' }, { key: 'code', label: 'Code' }, { key: 'city', label: 'City' }, { key: 'managerName', label: 'Manager' }, { key: 'isActive', label: 'Status', kind: 'active' }],
    searchKeys: ['name', 'code', 'city', 'managerName'],
  },
  suppliers: {
    title: 'Suppliers', group: 'Inventory', endpoint: '/suppliers', description: 'Keep supplier contact and purchasing details in one place.',
    fields: [
      { key: 'name', label: 'Supplier name', required: true, placeholder: 'Supplier or company name' },
      { key: 'contactName', label: 'Contact person', placeholder: 'Full name' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'contact@example.com' },
      { key: 'phone', label: 'Phone', placeholder: '+251…' },
      { key: 'taxNumber', label: 'Tax number', placeholder: 'Optional' },
      { key: 'paymentTerms', label: 'Payment terms', placeholder: 'e.g. Net 30' },
      { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Supplier address' },
    ],
    columns: [{ key: 'name', label: 'Supplier' }, { key: 'contactName', label: 'Contact' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'isActive', label: 'Status', kind: 'active' }],
    searchKeys: ['name', 'contactName', 'email', 'phone'],
  },
  'purchase-orders': {
    title: 'Purchase orders', group: 'Inventory', endpoint: '/purchase-orders', description: 'Track replenishment orders and supplier receipt status. This view is read-only; receiving stock is handled by the purchase-order workflow.',
    readOnly: true,
    columns: [{ key: 'orderNumber', label: 'Purchase order' }, { key: 'supplier', label: 'Supplier', kind: 'supplier' }, { key: 'status', label: 'Status', kind: 'status' }, { key: 'totalCost', label: 'Total cost', kind: 'money' }, { key: 'expectedAt', label: 'Expected', kind: 'date' }],
    searchKeys: ['orderNumber', 'status', 'currency'],
  },
  'supplier-products': {
    title: 'Supplier catalog', group: 'Inventory', endpoint: '/supplier-products', description: 'Connect supplier records to product variants and maintain procurement pricing.',
    fields: [
      { key: 'supplierId', label: 'Supplier', type: 'supplier', required: true },
      { key: 'variantId', label: 'Product variant', type: 'variant', required: true },
      { key: 'supplierSku', label: 'Supplier SKU', placeholder: 'Supplier item code' },
      { key: 'costPrice', label: 'Unit cost', type: 'number', min: 0, step: '0.01', required: true },
      { key: 'currency', label: 'Currency', type: 'select', options: [{ label: 'ETB', value: 'ETB' }, { label: 'USD', value: 'USD' }] },
      { key: 'leadTimeDays', label: 'Lead time (days)', type: 'number', min: 0, step: 1 },
      { key: 'minimumOrderQty', label: 'Minimum order quantity', type: 'number', min: 1, step: 1 },
      { key: 'isPrimary', label: 'Primary supplier', type: 'select', options: [{ label: 'No', value: false }, { label: 'Yes', value: true }] },
    ],
    columns: [{ key: 'supplier', label: 'Supplier', kind: 'supplier' }, { key: 'variant', label: 'Product variant', kind: 'variant' }, { key: 'supplierSku', label: 'Supplier SKU' }, { key: 'costPrice', label: 'Unit cost', kind: 'money' }, { key: 'leadTimeDays', label: 'Lead time' }, { key: 'isPrimary', label: 'Primary', kind: 'primary' }],
    searchKeys: ['supplierSku', 'currency'],
  },
  'affiliate-programs': {
    title: 'Affiliate programs', group: 'Growth', endpoint: '/affiliate-programs', listEndpoint: '/affiliate-programs/admin/all', description: 'Configure commission rules for products promoted by affiliates.',
    fields: [
      { key: 'name', label: 'Program name', required: true, placeholder: 'e.g. Standard product commission' },
      { key: 'productId', label: 'Product (optional)', type: 'product', placeholder: 'All products' },
      { key: 'commissionType', label: 'Commission type', type: 'select', options: [{ label: 'Percentage', value: 'percentage' }, { label: 'Fixed amount', value: 'fixed' }] },
      { key: 'commissionRate', label: 'Commission rate (%)', type: 'number', min: 0, step: '0.01' },
      { key: 'fixedCommission', label: 'Fixed commission amount', type: 'number', min: 0, step: '0.01' },
      { key: 'cookieDays', label: 'Cookie duration (days)', type: 'number', min: 1, step: 1 },
      { key: 'status', label: 'Program status', type: 'select', options: [{ label: 'Active', value: 'active' }, { label: 'Paused', value: 'paused' }] },
    ],
    columns: [{ key: 'name', label: 'Program' }, { key: 'product', label: 'Product', kind: 'product' }, { key: 'commissionType', label: 'Commission', kind: 'commission' }, { key: 'cookieDays', label: 'Cookie days' }, { key: 'status', label: 'Status', kind: 'status' }],
    searchKeys: ['name', 'status', 'commissionType'],
  },
}
const key = computed(() => route.params.resource || route.path.split('/').filter(Boolean).at(-1))
const config = computed(() => resources[key.value] || resources.brands)
const fields = computed(() => config.value.fields || [])
const visibleRows = computed(() => rows.value.filter(row => {
  const term = search.value.trim().toLowerCase()
  return !term || config.value.searchKeys.some(key => {
    const value = row[key]
    return String(value?.name || value || '').toLowerCase().includes(term)
  })
}))
const countLabel = computed(() => visibleRows.value.length === 1 ? 'record' : 'records')
function resetForm() {
  const next = {}
  fields.value.forEach(field => {
    next[field.key] = field.key === 'type' ? 'select'
      : field.key === 'commissionType' ? 'percentage'
      : field.key === 'commissionRate' ? 5
      : field.key === 'cookieDays' ? 30
      : field.key === 'status' ? 'active'
      : ['productId', 'supplierId', 'variantId'].includes(field.key) ? ''
      : field.key === 'currency' ? 'ETB'
      : field.key === 'minimumOrderQty' ? 1
      : field.key === 'costPrice' ? 0
      : field.key === 'leadTimeDays' ? 0
      : field.key === 'isPrimary' ? false
      : ''
  })
  form.value = next
}
function normalizeRows(data) { return Array.isArray(data) ? data : [] }
async function load() {
  loading.value = true
  error.value = ''
  try {
    const requests = [api.get(config.value.listEndpoint || config.value.endpoint)]
    if (['affiliate-programs', 'supplier-products'].includes(key.value)) requests.push(api.get('/products'))
    if (key.value === 'supplier-products') requests.push(api.get('/suppliers'))
    const responses = await Promise.all(requests)
    rows.value = normalizeRows(responses[0].data?.data)
    if (responses[1]) products.value = normalizeRows(responses[1].data?.data ?? responses[1].data?.products)
    if (responses[2]) suppliers.value = normalizeRows(responses[2].data?.data)
  } catch (err) {
    error.value = err.response?.data?.message || 'This module could not load. Check the backend connection and your management permissions.'
  } finally {
    loading.value = false
  }
}
async function createRecord() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const payload = {}
    fields.value.forEach(field => {
      const value = form.value[field.key]
      if (field.key === 'valuesText') {
        const values = String(value || '').split(',').map(item => item.trim()).filter(Boolean)
        if (values.length) payload.values = values
      } else if (value !== '' && value !== null && value !== undefined) {
        payload[field.key] = ['commissionRate', 'fixedCommission', 'cookieDays'].includes(field.key) ? Number(value) : value
      }
    })
    if (key.value === 'affiliate-programs' && !payload.productId) delete payload.productId
    if (key.value === 'supplier-products') {
      payload.costPrice = Number(payload.costPrice)
      payload.minimumOrderQty = Number(payload.minimumOrderQty || 1)
      payload.leadTimeDays = Number(payload.leadTimeDays || 0)
      payload.isPrimary = payload.isPrimary === true || payload.isPrimary === 'true'
    }
    await api.post(config.value.endpoint, payload)
    success.value = config.value.title.replace(/s$/, '') + ' created successfully.'
    showForm.value = false
    resetForm()
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Could not save this record.'
  } finally {
    saving.value = false
  }
}
function display(row, column) {
  const value = row[column.key]
  if (column.kind === 'active') return row.isActive === false ? 'Inactive' : 'Active'
  if (column.kind === 'values') return Array.isArray(value) ? value.map(item => item.label || item.value).join(', ') || '—' : '—'
  if (column.kind === 'supplier') return value?.name || '—'
  if (column.kind === 'product') return value?.name || (row.productId ? products.value.find(p => p.id === row.productId)?.name : 'All products') || 'All products'
  if (column.kind === 'variant') return value?.sku || (row.variant?.product?.name ? row.variant.product.name + ' · ' + (row.variant.sku || '') : '—')
  if (column.kind === 'primary') return row.isPrimary ? 'Yes' : 'No'
  if (column.kind === 'commission') return row.commissionType === 'fixed' ? (row.fixedCommission ? row.fixedCommission + ' ETB fixed' : 'Fixed amount') : (row.commissionRate ?? 0) + '%'
  if (column.kind === 'status') return String(value || 'draft').replaceAll('_', ' ')
  if (column.kind === 'money') return new Intl.NumberFormat(undefined, { style: 'currency', currency: row.currency || 'ETB', maximumFractionDigits: 2 }).format(Number(value) || 0)
  if (column.kind === 'date') {
    const date = new Date(value)
    return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : '—'
  }
  return value === null || value === undefined || value === '' ? '—' : String(value)
}
function badgeClass(row, column) {
  if (column.kind === 'active') return row.isActive === false ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
  const value = String(row[column.key] || 'draft').toLowerCase()
  return ['active', 'received', 'ordered'].includes(value) ? 'bg-emerald-50 text-emerald-700' : ['paused', 'cancelled'].includes(value) ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'
}
watch(key, () => { showForm.value = false; search.value = ''; resetForm(); load() })
onMounted(() => { resetForm(); load() })
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="text-[11px] font-bold uppercase tracking-[.15em] text-indigo-600">{{ config.group }} management</p><h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">{{ config.title }}</h2><p class="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">{{ config.description }}</p></div>
      <div class="flex gap-2">
        <button type="button" class="h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50" :disabled="loading" @click="load">Refresh</button>
        <button v-if="!config.readOnly" type="button" class="h-10 rounded-lg bg-slate-900 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-slate-700" @click="showForm = !showForm">{{ showForm ? 'Cancel' : '+ Add record' }}</button>
      </div>
    </header>
    <div v-if="error" role="alert" class="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800"><span>{{ error }}</span><button type="button" class="shrink-0 font-semibold underline" @click="load">Retry</button></div>
    <div v-if="success" role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{{ success }}</div>

    <form v-if="showForm" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createRecord">
      <div class="mb-4 flex items-start justify-between"><div><h3 class="text-[14px] font-bold text-slate-900">Add {{ config.title.toLowerCase().replace(/s$/, '') }}</h3><p class="mt-1 text-[12px] text-slate-500">Fields marked required must be completed.</p></div></div>
      <div class="grid gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="field in fields" :key="field.key" :class="field.type === 'textarea' ? 'sm:col-span-2' : ''">
          <label :for="'resource-' + field.key" class="mb-1.5 block text-[12px] font-semibold text-slate-700">{{ field.label }}<span v-if="field.required" class="ml-1 text-rose-500">*</span></label>
          <textarea v-if="field.type === 'textarea'" :id="'resource-' + field.key" v-model="form[field.key]" :required="field.required" :placeholder="field.placeholder"></textarea>
          <select v-else-if="field.type === 'select'" :id="'resource-' + field.key" v-model="form[field.key]" :required="field.required" class="w-full">
            <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <select v-else-if="field.type === 'product'" :id="'resource-' + field.key" v-model="form[field.key]" class="w-full"><option value="">{{ field.placeholder }}</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }}</option></select>
          <select v-else-if="field.type === 'supplier'" :id="'resource-' + field.key" v-model="form[field.key]" :required="field.required" class="w-full"><option value="">Select supplier</option><option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option></select>
          <select v-else-if="field.type === 'variant'" :id="'resource-' + field.key" v-model="form[field.key]" :required="field.required" class="w-full"><option value="">Select product variant</option><option v-for="variant in products.flatMap(product => (product.variants || []).map(variant => ({ ...variant, productName: product.name })))" :key="variant.id" :value="variant.id">{{ variant.productName }} · {{ variant.sku }}</option></select>
          <input v-else :id="'resource-' + field.key" v-model="form[field.key]" :type="field.type || 'text'" :required="field.required" :min="field.min" :step="field.step" :placeholder="field.placeholder" class="w-full" />
        </div>
      </div>
      <div class="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" class="h-9 rounded-lg border border-slate-200 px-3.5 text-[12px] font-semibold text-slate-600 hover:bg-slate-50" @click="showForm = false">Cancel</button><button type="submit" :disabled="saving" class="h-9 rounded-lg bg-indigo-600 px-4 text-[12px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{{ saving ? 'Saving…' : 'Save record' }}</button></div>
    </form>

    <div class="grid gap-3 sm:grid-cols-2"><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Total {{ config.title.toLowerCase() }}</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : rows.length }}</p></article><article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Visible records</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : visibleRows.length }}</p></article></div>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-[13px] font-bold text-slate-900">{{ config.title }} register</h3><p class="mt-0.5 text-[11px] text-slate-500">{{ visibleRows.length }} {{ countLabel }}</p></div><input v-model="search" type="search" :placeholder="'Search ' + config.title.toLowerCase() + '…'" class="w-full sm:max-w-[260px]" /></div>
      <div v-if="loading" class="space-y-3 p-5"><div v-for="n in 4" :key="n" class="h-10 animate-pulse rounded-md bg-slate-50"></div></div>
      <div v-else-if="!error && !visibleRows.length" class="px-6 py-12 text-center"><p class="text-[13px] font-semibold text-slate-800">No records found</p><p class="mt-1 text-[12px] text-slate-500">{{ rows.length ? 'Try a different search.' : 'Create your first record to get started.' }}</p></div>
      <div v-else-if="visibleRows.length" class="overflow-x-auto"><table class="w-full min-w-[650px] text-left text-[12px]"><thead class="bg-slate-50/80 text-slate-500"><tr><th v-for="column in config.columns" :key="column.key" class="px-4 py-3">{{ column.label }}</th></tr></thead><tbody><tr v-for="row in visibleRows" :key="row.id" class="border-t border-slate-100 transition hover:bg-slate-50/70"><td v-for="column in config.columns" :key="column.key" class="px-4 py-3.5 text-slate-600"><span v-if="['active','status'].includes(column.kind)" class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize" :class="badgeClass(row,column)">{{ display(row,column) }}</span><span v-else :class="column.key === 'name' || column.key === 'orderNumber' ? 'font-semibold text-slate-900' : ''">{{ display(row,column) }}</span></td></tr></tbody></table></div>
      <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] text-slate-400">Connected to {{ config.endpoint }} · Record access follows the backend's current permissions.</div>
    </div>
  </section>
</template>
