<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { addToCart } from '../../stores'
import api from '../../services/api'

const route = useRoute()
const product = ref(null)
const related = ref([])
const loading = ref(true)
const relatedLoading = ref(false)
const error = ref('')
const selectedVariantId = ref('')
const selectedImage = ref('')
const notice = ref('')
const saved = ref(false)
const variants = computed(() => (product.value?.variants || []).filter(variant => variant.status === 'active'))
const selectedVariant = computed(() => variants.value.find(variant => variant.id === selectedVariantId.value) || variants.value[0] || null)
const optionLabels = variant => (variant?.options || []).map(option => option.value?.label || option.value?.value).filter(Boolean).join(' / ')
const money = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const images = computed(() => {
  const raw = product.value?.gallery
  let gallery = []
  if (Array.isArray(raw)) gallery = raw
  else if (typeof raw === 'string') { try { const parsed = JSON.parse(raw); gallery = Array.isArray(parsed) ? parsed : [] } catch { gallery = [] } }
  const urls = gallery.map(item => typeof item === 'string' ? item : item?.url || item?.imageUrl).filter(Boolean)
  if (product.value?.imageUrl && !urls.includes(product.value.imageUrl)) urls.unshift(product.value.imageUrl)
  if (selectedVariant.value?.imageUrl && !urls.includes(selectedVariant.value.imageUrl)) urls.unshift(selectedVariant.value.imageUrl)
  return urls
})
const stockCount = computed(() => {
  const inventory = selectedVariant.value?.inventory || []
  if (!inventory.length) return null
  return inventory.reduce((total, item) => total + Number(item.quantityOnHand || 0), 0)
})
const specificationEntries = computed(() => {
  const specs = product.value?.specifications
  if (!specs) return []
  if (Array.isArray(specs)) return specs.map(item => Array.isArray(item) ? item : [item.label || item.name || 'Detail', item.value ?? item.description ?? ''])
  if (typeof specs === 'object') return Object.entries(specs)
  if (typeof specs === 'string') { try { const parsed = JSON.parse(specs); return Object.entries(parsed) } catch { return [['Details', specs]] } }
  return []
})
const attributes = computed(() => product.value?.attributeValues || [])

async function loadProduct() {
  loading.value = true
  error.value = ''
  notice.value = ''
  selectedImage.value = ''
  try {
    const response = await api.get('/products/' + route.params.slug)
    product.value = response.data?.data ?? response.data
    selectedVariantId.value = product.value?.variants?.find(variant => variant.status === 'active')?.id || ''
    saved.value = JSON.parse(localStorage.getItem('marketflow-wishlist') || '[]').includes(product.value?.id)
    selectedImage.value = images.value[0] || ''
    loadRelated()
  } catch (err) {
    product.value = null
    error.value = err.response?.data?.message || 'We could not load this product.'
  } finally {
    loading.value = false
  }
}
async function loadRelated() {
  if (!product.value?.categoryId && !product.value?.category?.id) { related.value = []; return }
  relatedLoading.value = true
  try {
    const response = await api.get('/products', { params: { categoryId: product.value.categoryId || product.value.category?.id, limit: 8 } })
    const data = response.data?.data ?? response.data?.products ?? []
    related.value = (Array.isArray(data) ? data : data?.rows || []).filter(item => item.id !== product.value.id).slice(0, 4)
  } catch { related.value = [] } finally { relatedLoading.value = false }
}
function addSelectedToCart() {
  if (!product.value || !selectedVariant.value) { notice.value = 'This product is currently unavailable to purchase.'; return }
  const added = addToCart(product.value, selectedVariant.value)
  notice.value = added ? 'Added to your shopping bag.' : 'Could not add this option. Please try another variant.'
}
function toggleSaved() {
  const list = JSON.parse(localStorage.getItem('marketflow-wishlist') || '[]')
  const next = list.includes(product.value.id) ? list.filter(id => id !== product.value.id) : [...list, product.value.id]
  localStorage.setItem('marketflow-wishlist', JSON.stringify(next))
  saved.value = next.includes(product.value.id)
}
watch(() => route.params.slug, loadProduct)
watch(selectedVariantId, () => { if (selectedVariant.value?.imageUrl) selectedImage.value = selectedVariant.value.imageUrl })
onMounted(loadProduct)
</script>

<template>
  <div v-if="loading" class="py-24 text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900"></div><p class="mt-4 text-sm text-stone-500">Loading product details…</p></div>
  <div v-else-if="!product" class="mx-auto max-w-xl py-20 text-center"><p class="text-[10px] font-bold uppercase tracking-[.2em] text-stone-400">Product unavailable</p><h1 class="mt-3 text-3xl font-black">We couldn’t find that item.</h1><p class="mt-3 text-sm text-stone-500">{{ error || 'This product may no longer be available.' }}</p><RouterLink to="/products" class="mt-6 inline-flex rounded-full bg-stone-950 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white">Back to products</RouterLink></div>
  <div v-else>
    <nav class="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400"><RouterLink to="/" class="hover:text-stone-950">Home</RouterLink><span>/</span><RouterLink to="/categories" class="hover:text-stone-950">Categories</RouterLink><span>/</span><RouterLink :to="{ path: '/products', query: product.categoryId ? { categoryId: product.categoryId } : {} }" class="hover:text-stone-950">{{ product.category?.name || 'Products' }}</RouterLink><span>/</span><span class="max-w-48 truncate text-stone-700">{{ product.name }}</span></nav>
    <section class="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)] lg:gap-14">
      <div class="min-w-0">
        <div class="relative overflow-hidden rounded-2xl bg-stone-100">
          <img v-if="selectedImage" :src="selectedImage" :alt="product.name" class="aspect-[4/5] w-full object-cover sm:aspect-[5/6]"/>
          <div v-else class="flex aspect-[4/5] flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-[#e8dfd4] text-stone-400"><span class="text-7xl">✳</span><span class="mt-4 text-[10px] font-bold uppercase tracking-[.25em]">Product image</span></div>
          <button @click="toggleSaved" :aria-pressed="saved" class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-xl shadow-sm" :class="saved ? 'text-rose-600' : 'text-stone-700'">{{ saved ? '♥' : '♡' }}</button>
        </div>
        <div v-if="images.length > 1" class="mt-3 grid grid-cols-5 gap-2">
          <button v-for="(image, index) in images" :key="image" @click="selectedImage = image" :aria-label="'View product image ' + (index + 1)" class="overflow-hidden rounded-lg border-2" :class="selectedImage === image ? 'border-stone-950' : 'border-transparent opacity-70 hover:opacity-100'"><img :src="image" :alt="product.name + ' image ' + (index + 1)" class="aspect-[4/5] w-full object-cover"/></button>
        </div>
      </div>
      <div class="lg:sticky lg:top-28 lg:self-start">
        <p class="text-[10px] font-extrabold uppercase tracking-[.24em] text-stone-500">{{ product.category?.name || 'The collection' }}<span v-if="product.brand?.name"> · {{ product.brand.name }}</span></p>
        <h1 class="mt-3 text-3xl font-black leading-tight tracking-[-.055em] sm:text-4xl">{{ product.name }}</h1>
        <div class="mt-5 flex flex-wrap items-baseline gap-3"><p class="text-2xl font-black tracking-tight">{{ money(selectedVariant?.price ?? product.price) }} <span class="text-sm font-semibold">{{ product.currency || 'ETB' }}</span></p><p v-if="selectedVariant?.compareAtPrice || product.compareAtPrice" class="text-sm text-stone-400 line-through">{{ money(selectedVariant?.compareAtPrice || product.compareAtPrice) }} {{ product.currency || 'ETB' }}</p></div>
        <p v-if="stockCount !== null" class="mt-3 inline-flex items-center gap-2 text-xs font-semibold" :class="stockCount > 0 ? 'text-emerald-700' : 'text-red-600'"><span class="h-2 w-2 rounded-full" :class="stockCount > 0 ? 'bg-emerald-500' : 'bg-red-500'"></span>{{ stockCount > 0 ? stockCount + ' available' : 'Currently out of stock' }}</p>
        <p class="mt-5 whitespace-pre-line text-sm leading-7 text-stone-600">{{ product.description || 'Explore the details below and choose an available option before adding this item to your bag.' }}</p>

        <div v-if="variants.length" class="mt-7 border-t border-stone-200 pt-6">
          <div class="flex items-center justify-between gap-3"><label for="product-variant" class="text-xs font-bold uppercase tracking-wider">Choose your option</label><span class="text-[10px] text-stone-400">{{ variants.length }} {{ variants.length === 1 ? 'option' : 'options' }}</span></div>
          <select id="product-variant" v-model="selectedVariantId" class="mt-3 !min-h-12 !rounded-xl !border-stone-200 !px-4">
            <option v-for="variant in variants" :key="variant.id" :value="variant.id">{{ optionLabels(variant) || variant.sku || 'Standard option' }} · {{ money(variant.price ?? product.price) }} {{ product.currency || 'ETB' }}</option>
          </select>
          <p v-if="selectedVariant?.sku" class="mt-2 text-[10px] text-stone-400">SKU: {{ selectedVariant.sku }}</p>
        </div>
        <div v-else class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">This product has no active variants configured yet. The store manager needs to add a purchasable option before checkout is possible.</div>

        <p v-if="notice" role="status" class="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{{ notice }} <RouterLink to="/cart" class="ml-2 underline">View bag</RouterLink></p>
        <button :disabled="!selectedVariant || stockCount === 0" @click="addSelectedToCart" class="mt-5 w-full rounded-full bg-stone-950 px-6 py-4 text-xs font-extrabold uppercase tracking-[.15em] text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40">{{ stockCount === 0 ? 'Out of stock' : 'Add to bag' }} <span class="ml-2">· {{ money(selectedVariant?.price ?? product.price) }} {{ product.currency || 'ETB' }}</span></button>
        <RouterLink to="/cart" class="mt-3 block w-full rounded-full border border-stone-300 px-6 py-4 text-center text-xs font-extrabold uppercase tracking-[.15em] transition hover:border-stone-950">View shopping bag</RouterLink>

        <div class="mt-7 divide-y divide-stone-200 border-y border-stone-200">
          <div class="flex gap-3 py-4"><span class="text-lg">↗</span><div><p class="text-xs font-bold">Order tracking</p><p class="mt-1 text-xs leading-5 text-stone-500">View order progress from your account after purchase.</p></div></div>
          <div class="flex gap-3 py-4"><span class="text-lg">♡</span><div><p class="text-xs font-bold">Save for later</p><p class="mt-1 text-xs leading-5 text-stone-500">Tap the heart to keep this item in your saved favourites on this device.</p></div></div>
        </div>
        <div v-if="attributes.length || specificationEntries.length" class="mt-7"><h2 class="text-sm font-black uppercase tracking-wider">Product details</h2><dl class="mt-3 divide-y divide-stone-100 border-y border-stone-200">
          <div v-for="(item, index) in attributes" :key="item.id || index" class="flex justify-between gap-4 py-3 text-xs"><dt class="text-stone-500">{{ item.attribute?.name || 'Attribute' }}</dt><dd class="text-right font-semibold">{{ item.value?.label || item.value?.value || item.textValue || item.numberValue || item.booleanValue }}</dd></div>
          <div v-for="(entry, index) in specificationEntries" :key="index" class="flex justify-between gap-4 py-3 text-xs"><dt class="text-stone-500">{{ entry[0] }}</dt><dd class="text-right font-semibold">{{ entry[1] }}</dd></div>
        </dl></div>
      </div>
    </section>

    <section v-if="related.length" class="mt-16 border-t border-stone-200 pt-10"><div class="flex items-end justify-between gap-4"><div><p class="text-[10px] font-extrabold uppercase tracking-[.22em] text-stone-500">Keep exploring</p><h2 class="mt-2 text-3xl font-black tracking-[-.05em]">You may also like.</h2></div><RouterLink :to="{ path: '/products', query: product.categoryId ? { categoryId: product.categoryId } : {} }" class="text-[10px] font-bold uppercase tracking-wider underline underline-offset-4">View collection ↗</RouterLink></div>
      <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5"><RouterLink v-for="item in related" :key="item.id" :to="'/products/' + item.slug" class="group min-w-0"><div class="aspect-[3/4] overflow-hidden rounded-xl bg-stone-100"><img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div v-else class="flex h-full items-center justify-center text-4xl text-stone-400">✳</div></div><h3 class="mt-3 text-xs font-semibold leading-5 sm:text-sm">{{ item.name }}</h3><p class="mt-2 text-sm font-black">{{ money(item.price) }} <span class="text-[10px] font-semibold text-stone-500">{{ item.currency || 'ETB' }}</span></p></RouterLink></div>
    </section>
  </div>
</template>
