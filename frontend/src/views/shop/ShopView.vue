<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import api from '../../services/api'
import { addToCart } from '../../stores'
import LoadingState from '../../components/ui/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const products = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const category = ref(String(route.query.categoryId || ''))
const search = ref(String(route.query.q || ''))
const sort = ref('featured')
const minPrice = ref('')
const maxPrice = ref('')
const inStockOnly = ref(false)
const savedOnly = ref(false)
const selectedBrand = ref('')
const minRating = ref('0')
const onSaleOnly = ref(false)
const expandedCategoryIds = ref([])
const page = ref(1)
const pageSize = 12
const adding = ref('')
const notice = ref('')
const wishlist = ref(JSON.parse(localStorage.getItem('marketflow-wishlist') || '[]'))
const money = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const isSaved = product => wishlist.value.includes(product.id)
const productList = value => Array.isArray(value) ? value : (value?.rows || value?.items || value?.products || [])
const categoryList = value => Array.isArray(value) ? value : (value?.rows || value?.items || value?.categories || [])

const filteredProducts = computed(() => {
  let result = [...products.value]
  const low = minPrice.value === '' ? null : Number(minPrice.value)
  const high = maxPrice.value === '' ? null : Number(maxPrice.value)
  if (low !== null && Number.isFinite(low)) result = result.filter(item => Number(item.price || 0) >= low)
  if (high !== null && Number.isFinite(high)) result = result.filter(item => Number(item.price || 0) <= high)
  if (inStockOnly.value) result = result.filter(item => {
    const directStock = item.stockQuantity ?? item.inventoryQuantity ?? item.quantity ?? item.stock
    const variantStock = (item.variants || []).reduce((sum, variant) => sum + (variant.inventory || []).reduce((n, inventory) => n + Number(inventory.quantityOnHand || 0), 0), 0)
    const hasInventoryRecords = (item.variants || []).some(variant => Array.isArray(variant.inventory) && variant.inventory.length > 0)
    const available = item.isAvailable ?? item.inStock
    if (available === false) return false
    if (directStock !== undefined) return Number(directStock) > 0
    if (hasInventoryRecords) return variantStock > 0
    return true
  })
  if (savedOnly.value) result = result.filter(isSaved)
  if (selectedBrand.value) result = result.filter(item => String(item.brand?.name || item.brandName || item.brand || '') === selectedBrand.value)
  if (Number(minRating.value) > 0) result = result.filter(item => Number(item.averageRating ?? item.rating ?? item.reviewSummary?.average ?? 0) >= Number(minRating.value))
  if (onSaleOnly.value) result = result.filter(item => Number(item.compareAtPrice ?? item.originalPrice ?? item.mrp ?? 0) > Number(item.price || 0))
  if (sort.value === 'price-low') result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  if (sort.value === 'price-high') result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
  if (sort.value === 'name') result.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  if (sort.value === 'newest') result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  return result
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize)))
const pageProducts = computed(() => filteredProducts.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const activeFilterCount = computed(() => [category.value, minPrice.value !== '', maxPrice.value !== '', inStockOnly.value, savedOnly.value, search.value.trim() !== '', selectedBrand.value, Number(minRating.value) > 0, onSaleOnly.value].filter(Boolean).length)
const selectedCategoryName = computed(() => categories.value.find(item => String(item.id) === String(category.value))?.name || '')
const brands = computed(() => [...new Set(products.value.map(item => item.brand?.name || item.brandName || item.brand).filter(value => typeof value === 'string' && value.trim()))].sort((a, b) => a.localeCompare(b)))
const categoryParentId = item => item.parentId ?? item.parent_id ?? item.parent?.id ?? item.parentCategoryId ?? null
const childrenOf = item => categories.value.filter(child => String(categoryParentId(child) ?? '') === String(item.id))
const hasChildren = item => childrenOf(item).length > 0
const categoryRows = computed(() => {
  const rows = []
  const roots = categories.value.filter(item => !categoryParentId(item))
  const visit = (items, depth = 0, ancestors = new Set()) => {
    for (const item of items) {
      if (ancestors.has(String(item.id))) continue
      rows.push({ item, depth })
      if (expandedCategoryIds.value.includes(String(item.id))) {
        const next = new Set(ancestors)
        next.add(String(item.id))
        visit(childrenOf(item), depth + 1, next)
      }
    }
  }
  visit(roots.length ? roots : categories.value.filter(item => !categories.value.some(parent => String(parent.id) === String(categoryParentId(item)))))
  return rows
})
function toggleCategory(item) {
  const id = String(item.id)
  expandedCategoryIds.value = expandedCategoryIds.value.includes(id) ? expandedCategoryIds.value.filter(value => value !== id) : [...expandedCategoryIds.value, id]
}
async function shareProduct(product) {
  const code = localStorage.getItem('affiliateCode') || localStorage.getItem('affiliate_code') || ''
  const url = new URL('/products/' + encodeURIComponent(product.slug || product.id), window.location.origin)
  if (code) url.searchParams.set('ref', code)
  const shareData = { title: product.name, text: 'Take a look at ' + product.name, url: url.toString() }
  try {
    if (navigator.share) await navigator.share(shareData)
    else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url.toString()); notice.value = 'Product link copied to clipboard.' }
    else { window.prompt('Copy this product link', url.toString()) }
  } catch (error) {
    if (error?.name !== 'AbortError') notice.value = 'Unable to share this product right now.'
  }
}

async function load() {
  loading.value = true
  error.value = ''
  page.value = 1
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get('/products', { params: { q: search.value.trim() || undefined, categoryId: category.value || undefined, limit: 100, page: 1 } }),
      api.get('/categories'),
    ])
    products.value = productList(productResponse.data?.data ?? productResponse.data?.products ?? productResponse.data)
    categories.value = categoryList(categoryResponse.data?.data ?? categoryResponse.data?.categories ?? categoryResponse.data)
  } catch (err) {
    error.value = err.response?.data?.message || 'We couldn’t load the live catalog. Check your API connection and try again.'
  } finally {
    loading.value = false
  }
}
function buy(product) {
  const activeVariant = (product.variants || []).find(variant => variant.status === 'active')
  const added = activeVariant ? addToCart(product, activeVariant) : false
  notice.value = added ? product.name + ' was added to your cart.' : 'This product has no active purchasable option yet. Open the product page for details.'
  adding.value = product.id
  window.setTimeout(() => { adding.value = '' }, 900)
}
function toggleSaved(product) {
  wishlist.value = isSaved(product) ? wishlist.value.filter(id => id !== product.id) : [...wishlist.value, product.id]
  localStorage.setItem('marketflow-wishlist', JSON.stringify(wishlist.value))
}
function chooseCategory(id) {
  category.value = id
  router.replace({ path: '/products', query: { ...(search.value.trim() ? { q: search.value.trim() } : {}), ...(id ? { categoryId: id } : {}) } })
  load()
}
function clearFilters() {
  category.value = ''
  search.value = ''
  minPrice.value = ''
  maxPrice.value = ''
  inStockOnly.value = false
  savedOnly.value = false
  selectedBrand.value = ''
  minRating.value = '0'
  onSaleOnly.value = false
  sort.value = 'featured'
  router.replace({ path: '/products' })
  load()
}
watch(() => route.query.q, next => { const value = String(next || ''); if (value !== search.value) { search.value = value; load() } })
watch(() => route.query.categoryId, next => {
  const value = String(next || '')
  if (value !== category.value) { category.value = value; load() }
})
watch([minPrice, maxPrice, inStockOnly, savedOnly, sort], () => { page.value = 1 })
onMounted(load)
</script>

<template>
  <div>
    <div class="mb-7 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="text-[10px] font-extrabold uppercase tracking-[.25em] text-stone-500">The complete collection</p><h1 class="mt-2 text-4xl font-black tracking-[-.06em] sm:text-5xl">All products<span v-if="selectedCategoryName"> / {{ selectedCategoryName }}</span></h1><p class="mt-3 max-w-xl text-sm leading-6 text-stone-500">Search the live catalog, narrow by category and price, save favourites, and open each product to choose its available options.</p></div>
      <RouterLink to="/categories" class="shrink-0 text-[10px] font-extrabold uppercase tracking-wider underline underline-offset-4">Explore categories ↗</RouterLink>
    </div>

    <form class="flex gap-2" @submit.prevent="load">
      <label class="relative min-w-0 flex-1"><span class="sr-only">Search products</span><span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">⌕</span><input v-model="search" aria-label="Search products" placeholder="Search products by name…" class="!min-h-12 !rounded-full !border-stone-200 !bg-white !pl-10 !pr-4"/></label>
      <button class="min-h-12 rounded-full bg-stone-950 px-6 text-[10px] font-extrabold uppercase tracking-wider text-white transition hover:bg-stone-700">Search</button>
    </form>

    <div class="mt-5 flex gap-2 overflow-x-auto pb-2">
      <button @click="chooseCategory('')" :class="!category ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-600'" class="shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">All products</button>
      <button v-for="item in categories" :key="item.id" @click="chooseCategory(String(item.id))" :class="String(category) === String(item.id) ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-600'" class="shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider">{{ item.name }}</button>
    </div>

    <div class="mt-6 grid items-start gap-7 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside class="rounded-2xl border border-stone-200 bg-white p-5">
        <div class="flex items-center justify-between"><h2 class="text-sm font-black uppercase tracking-wider">Filters</h2><button v-if="activeFilterCount" @click="clearFilters" class="text-[10px] font-bold underline underline-offset-2">Clear all</button></div>
        <div class="mt-5 border-t border-stone-100 pt-5">
          <p class="text-xs font-bold">Price range <span class="font-normal text-stone-400">(ETB)</span></p>
          <div class="mt-3 grid grid-cols-2 gap-2"><label><span class="sr-only">Minimum price</span><input v-model="minPrice" type="number" min="0" placeholder="Min" class="!min-h-10 !rounded-lg !px-3"/></label><label><span class="sr-only">Maximum price</span><input v-model="maxPrice" type="number" min="0" placeholder="Max" class="!min-h-10 !rounded-lg !px-3"/></label></div>
        </div>
        <div class="mt-5 border-t border-stone-100 pt-5">
          <p class="text-xs font-bold">Availability</p>
          <label class="mt-3 flex cursor-pointer items-center gap-2 text-xs text-stone-600"><input v-model="inStockOnly" type="checkbox" class="!h-4 !w-4 !min-h-0"/> Available items</label>
          <label class="mt-3 flex cursor-pointer items-center gap-2 text-xs text-stone-600"><input v-model="savedOnly" type="checkbox" class="!h-4 !w-4 !min-h-0"/> My saved favourites ({{ wishlist.length }})</label>
        </div>
        <div v-if="brands.length" class="mt-5 border-t border-stone-100 pt-5">
          <label class="text-xs font-bold" for="brand-filter">Brand</label>
          <select id="brand-filter" v-model="selectedBrand" class="mt-3 !min-h-10 !w-full !rounded-lg !border-stone-200 !px-3 !text-xs"><option value="">All brands</option><option v-for="brand in brands" :key="brand" :value="brand">{{ brand }}</option></select>
        </div>
        <div class="mt-5 border-t border-stone-100 pt-5">
          <p class="text-xs font-bold">Customer rating</p>
          <div class="mt-3 grid gap-2">
            <label v-for="rating in [{ value: '0', label: 'Any rating' }, { value: '4', label: '4 stars & up' }, { value: '3', label: '3 stars & up' }, { value: '2', label: '2 stars & up' }]" :key="rating.value" class="flex cursor-pointer items-center gap-2 text-xs text-stone-600"><input v-model="minRating" type="radio" :value="rating.value" class="!h-4 !w-4 !min-h-0"/> {{ rating.label }}</label>
          </div>
        </div>
        <div class="mt-5 border-t border-stone-100 pt-5">
          <p class="text-xs font-bold">Special offers</p>
          <label class="mt-3 flex cursor-pointer items-center gap-2 text-xs text-stone-600"><input v-model="onSaleOnly" type="checkbox" class="!h-4 !w-4 !min-h-0"/> On sale</label>
        </div>
        <div class="mt-5 border-t border-stone-100 pt-5">
          <p class="text-xs font-bold">Categories</p>
          <div class="mt-3 max-h-80 space-y-1 overflow-y-auto">
            <button @click="chooseCategory('')" class="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-xs" :class="!category ? 'bg-stone-100 font-bold text-stone-950' : 'text-stone-500 hover:bg-stone-50'"><span>All categories</span><span class="text-stone-400">All</span></button>
            <div v-for="row in categoryRows" :key="row.item.id">
              <div class="flex items-center gap-1 rounded-lg pr-2 transition" :class="String(category) === String(row.item.id) ? 'bg-stone-100' : 'hover:bg-stone-50'" :style="{ marginLeft: (row.depth * 12) + 'px' }">
                <button v-if="hasChildren(row.item)" @click="toggleCategory(row.item)" :aria-label="(expandedCategoryIds.includes(String(row.item.id)) ? 'Collapse ' : 'Expand ') + row.item.name" :aria-expanded="expandedCategoryIds.includes(String(row.item.id))" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-stone-500 hover:bg-stone-200">
                  <svg class="h-3.5 w-3.5 transition-transform" :class="expandedCategoryIds.includes(String(row.item.id)) ? 'rotate-90' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 4 6 6-6 6"/></svg>
                </button>
                <span v-else class="w-8 shrink-0 text-center text-stone-300">·</span>
                <button @click="chooseCategory(String(row.item.id))" class="min-w-0 flex-1 py-2.5 text-left text-xs" :class="String(category) === String(row.item.id) ? 'font-bold text-stone-950' : 'text-stone-600'"><span class="block truncate">{{ row.item.name }}</span></button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section class="min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-stone-500">{{ loading ? 'Loading live products…' : filteredProducts.length + (filteredProducts.length === 1 ? ' item' : ' items') }}<span v-if="activeFilterCount"> · {{ activeFilterCount }} active filters</span></p>
          <label class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">Sort by
            <select v-model="sort" aria-label="Sort products" class="!min-h-10 !w-auto !rounded-full !border-stone-200 !px-4 !text-xs !font-semibold !normal-case !tracking-normal">
              <option value="featured">Recommended</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name A–Z</option>
            </select>
          </label>
        </div>
        <p v-if="notice" role="status" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">{{ notice }} <RouterLink to="/cart" class="ml-2 underline underline-offset-2">View cart →</RouterLink></p>
        <div v-if="error" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p class="font-bold">Catalog unavailable</p><p class="mt-1">{{ error }}</p><button @click="load" class="mt-3 font-bold underline">Try again</button></div>
        <LoadingState v-if="loading"/>
        <div v-else-if="pageProducts.length" class="mt-5 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
          <article v-for="(product, index) in pageProducts" :key="product.id" class="group min-w-0">
            <div class="relative overflow-hidden rounded-xl bg-stone-100">
              <RouterLink :to="'/products/' + product.slug" class="block"><div class="aspect-[3/4] overflow-hidden">
                <img v-if="product.imageUrl || product.image" :src="product.imageUrl || product.image" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105"/>
                <div v-else class="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-[#e8dfd4] text-4xl text-stone-400">{{ ['✳','◇','◯','✦'][index % 4] }}</div>
              </div></RouterLink>
              <span class="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-stone-700">Shop now</span>
              <button @click="shareProduct(product)" :aria-label="'Share ' + product.name" title="Share product" class="absolute right-12 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow-sm hover:bg-white"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2M8.7 13.4l6.6 4.2"/></svg></button>
              <button @click="toggleSaved(product)" :aria-label="isSaved(product) ? 'Remove from saved items' : 'Save item'" :aria-pressed="isSaved(product)" class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg" :class="isSaved(product) ? 'text-rose-600' : 'text-stone-600'">{{ isSaved(product) ? '♥' : '♡' }}</button>
              <button @click="buy(product)" class="absolute bottom-2 left-2 right-2 rounded-full bg-white/95 px-3 py-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-950 shadow-sm transition sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">{{ adding === product.id ? 'Added ✓' : 'Quick add +' }}</button>
            </div>
            <div class="pt-3"><p class="text-[9px] font-bold uppercase tracking-[.15em] text-stone-400">{{ product.category?.name || 'Store collection' }}</p><RouterLink :to="'/products/' + product.slug" class="mt-1.5 block min-h-10 text-xs font-semibold leading-5 text-stone-900 hover:text-stone-500 sm:text-sm">{{ product.name }}</RouterLink><p class="mt-2 text-sm font-black">{{ money(product.price) }} <span class="text-[10px] font-semibold text-stone-500">{{ product.currency || 'ETB' }}</span></p><button @click="buy(product)" class="mt-3 w-full rounded-full border border-stone-200 py-2.5 text-[10px] font-extrabold uppercase tracking-wider hover:border-stone-950 hover:bg-stone-950 hover:text-white sm:hidden">{{ adding === product.id ? 'Added ✓' : 'Add to cart +' }}</button></div>
          </article>
        </div>
        <div v-else-if="!error" class="mt-6 rounded-2xl border border-dashed border-stone-300 p-10 text-center"><p class="text-3xl text-stone-300">◇</p><h2 class="mt-3 text-lg font-black">No matching products</h2><p class="mt-2 text-sm text-stone-500">Try changing your search or filters to see more items.</p><button @click="clearFilters" class="mt-4 rounded-full bg-stone-950 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white">Clear filters</button></div>
        <div v-if="!loading && totalPages > 1" class="mt-8 flex items-center justify-center gap-3"><button :disabled="page <= 1" @click="page--" class="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold disabled:opacity-30">← Previous</button><span class="text-xs text-stone-500">Page {{ page }} of {{ totalPages }}</span><button :disabled="page >= totalPages" @click="page++" class="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold disabled:opacity-30">Next →</button></div>
      </section>
    </div>
  </div>
</template>
