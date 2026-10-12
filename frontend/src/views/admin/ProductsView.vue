<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../services/api'
import AdminPagination from '../../components/admin/AdminPagination.vue'

const products = ref([])
const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const showForm = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedImage = ref(null)
const imagePreview = ref('')
const paginatedProducts = computed(() => products.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const form = ref({ name: '', categoryId: '', description: '', sku: '', price: 0, currency: 'ETB', imageUrl: '', quantity: 10 })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get('/products/admin/all'),
      api.get('/categories'),
    ])
    products.value = productResponse.data?.data ?? productResponse.data?.products ?? []
    categories.value = categoryResponse.data?.data ?? categoryResponse.data?.categories ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load catalog data. Check the backend and your management access.'
  } finally {
    loading.value = false
  }
}

async function createProduct() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const name = form.value.name.trim()
    const sku = form.value.sku.trim() || name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    const price = Number(form.value.price)
    if (!name || !form.value.categoryId || !sku || !Number.isFinite(price) || price < 0) {
      throw new Error('Enter a product name, category, SKU and a valid non-negative price.')
    }
    const payload = new FormData()
    payload.append('name', name)
    payload.append('categoryId', form.value.categoryId)
    payload.append('description', form.value.description.trim())
    payload.append('sku', sku)
    payload.append('price', String(price))
    payload.append('currency', form.value.currency || 'ETB')
    payload.append('status', 'active')
    payload.append('affiliateEnabled', 'true')
    payload.append('variants', JSON.stringify([{
        sku: sku + '-DEFAULT', price, status: 'active', inventory: [],
      }]))
    if (selectedImage.value) payload.append('image', selectedImage.value)
    const response = await api.post('/products', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    const created = response.data?.data
    if (created) products.value.unshift(created)
    form.value = { name: '', categoryId: '', description: '', sku: '', price: 0, currency: 'ETB', imageUrl: '', quantity: 10 }
    selectedImage.value = null
    imagePreview.value = ''
    showForm.value = false
    success.value = 'Product saved to the backend. Add inventory from your stock workflow as needed.'
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Could not create product.'
  } finally {
    saving.value = false
  }
}

async function toggleStatus(product) {
  const nextStatus = product.status === 'active' ? 'draft' : 'active'
  error.value = ''
  success.value = ''
  try {
    await api.patch('/products/' + product.id, { status: nextStatus })
    product.status = nextStatus
    success.value = 'Product status updated.'
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not update product status.'
  }
}

function onImageChange(event) {
  const file = event.target.files?.[0] || null
  selectedImage.value = file
  imagePreview.value = file ? URL.createObjectURL(file) : ''
}

function stockFor(product) {
  const variants = product.variants || []
  return variants.reduce((total, variant) => total + (variant.inventory || []).reduce((sum, row) => sum + Number(row.quantityOnHand || 0), 0), 0)
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <p class="mb-3 text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Products</span></p>
    <header class="flex flex-col justify-end gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
      <div class="flex gap-2 sm:ml-auto">
        <button class="h-9 border border-slate-300 bg-white px-3.5 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50" @click="load">Refresh</button>
        <button class="h-9 bg-indigo-600 px-3.5 text-[12px] font-semibold text-white transition hover:bg-indigo-700" @click="showForm = !showForm">{{ showForm ? 'Cancel' : '+ New product' }}</button>
      </div>
    </header>

    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{{ success }}</p>

    <form v-if="showForm" class="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-2" @submit.prevent="createProduct">
      <div>
        <label class="mb-1 block text-sm font-semibold">Product name</label>
        <input v-model="form.name" required maxlength="180" class="w-full rounded-xl border px-3 py-2.5" placeholder="e.g. Everyday cotton T-shirt" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-semibold">Category</label>
        <select v-model="form.categoryId" required class="w-full rounded-xl border bg-white px-3 py-2.5">
          <option value="" disabled>Select a category</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.parentId ? '— ' : '' }}{{ category.name }}</option>
        </select>
        <p v-if="!categories.length" class="mt-1 text-xs text-amber-700">Create a category first.</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-semibold">SKU</label>
        <input v-model="form.sku" maxlength="80" class="w-full rounded-xl border px-3 py-2.5" placeholder="Auto-generated if blank" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-semibold">Price</label>
        <div class="flex gap-2">
          <input v-model.number="form.price" type="number" min="0" step="0.01" required class="min-w-0 flex-1 rounded-xl border px-3 py-2.5" />
          <select v-model="form.currency" class="rounded-xl border bg-white px-3 py-2.5"><option>ETB</option><option>USD</option></select>
        </div>
      </div>
      <div class="md:col-span-2">
        <label class="mb-1 block text-sm font-semibold">Product image</label>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="w-full rounded-xl border px-3 py-2.5" @change="onImageChange" />
        <img v-if="imagePreview" :src="imagePreview" alt="Product image preview" class="mt-3 h-24 w-24 border border-slate-200 object-cover" />
      </div>
      <div class="md:col-span-2">
        <label class="mb-1 block text-sm font-semibold">Description</label>
        <textarea v-model="form.description" rows="3" class="w-full rounded-xl border px-3 py-2.5" placeholder="Product details customers should know"></textarea>
      </div>
      <div class="md:col-span-2">
        <button type="submit" :disabled="saving || !categories.length" class="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white disabled:opacity-50">{{ saving ? 'Saving…' : 'Create and publish product' }}</button>
      </div>
    </form>

    <div v-if="!showForm" class="overflow-hidden border border-slate-200 bg-white">
      <p v-if="loading" class="p-6 text-sm text-slate-500">Loading products from the backend…</p>
      <p v-else-if="!products.length" class="p-6 text-sm text-slate-500">No products found. Create a category, then add your first product.</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th class="p-4">Product</th><th class="p-4">SKU</th><th class="p-4">Price</th><th class="p-4">Stock</th><th class="p-4">Status</th><th class="p-4">Action</th></tr></thead>
          <tbody>
            <tr v-for="product in paginatedProducts" :key="product.id" class="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
              <td class="p-4"><div class="flex items-center gap-3"><img v-if="product.imageUrl" :src="product.imageUrl" class="h-10 w-10 border border-slate-200 object-cover" /><div><p class="font-bold">{{ product.name }}</p><p class="text-xs text-slate-500">{{ product.category?.name || 'Uncategorized' }}</p></div></div></td>
              <td class="p-4 font-mono text-xs">{{ product.sku || '—' }}</td>
              <td class="p-4 font-semibold">{{ Number(product.price || 0).toLocaleString() }} {{ product.currency || 'ETB' }}</td>
              <td class="p-4">{{ stockFor(product) }}</td>
              <td class="p-4"><span class="inline-flex border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold">{{ product.status }}</span></td>
              <td class="p-4"><button class="font-semibold text-indigo-600" @click="toggleStatus(product)">{{ product.status === 'active' ? 'Unpublish' : 'Publish' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <AdminPagination v-if="!showForm && !loading && products.length" v-model:page="currentPage" v-model:page-size="pageSize" :total="products.length" />
  </section>
</template>
