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
    const stock = item.stockQuantity ?? item.inventoryQuantity ?? item.quantity ?? item.stock
    const available = item.isAvailable ?? item.inStock
    return available === true || (available !== false && (stock === undefined || Number(stock) > 0))
  })
  if (savedOnly.value) result = result.filter(isSaved)
  if (sort.value === 'price-low') result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  if (sort.value === 'price-high') result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
  if (sort.value === 'name') result.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  if (sort.value === 'newest') result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  return result
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize)))
const pageProducts = computed(() => filteredProducts.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const activeFilterCount = computed(() => [category.value, minPrice.value !== '', maxPrice.value !== '', inStockOnly.value, savedOnly.value, search.value.trim() !== ''].filter(Boolean).length)
const selectedCategoryName = computed(() => categories.value.find(item => String(item.id) === String(category.value))?.name || '')

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
  const added = addToCart(product)
  notice.value = added ? product.name + ' was added to your bag.' : 'This product has no active purchasable option yet. Open the product page to choose an available option.'
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
  sort.value = 'featured'
  router.replace({ path: '/products' })
  load()
}
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
        <div class="mt-5 border-t border-stone-100 pt-5">
          <p class="text-xs font-bold">Categories</p>
          <div class="mt-3 max-h-64 space-y-3 overflow-y-auto">
            <button @click="chooseCategory('')" class="flex w-full items-center justify-between text-left text-xs" :class="!category ? 'font-bold text-stone-950' : 'text-stone-500'"><span>All categories</span><span>›</span></button>
            <button v-for="item in categories" :key="item.id" @click="chooseCategory(String(item.id))" class="flex w-full items-center justify-between gap-2 text-left text-xs" :class="String(category) === String(item.id) ? 'font-bold text-stone-950' : 'text-stone-500'"><span>{{ item.name }}</span><span>›</span></button>
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
        <p v-if="notice" role="status" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">{{ notice }} <RouterLink to="/cart" class="ml-2 underline underline-offset-2">View bag →</RouterLink></p>
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
              <button @click="toggleSaved(product)" :aria-label="isSaved(product) ? 'Remove from saved items' : 'Save item'" :aria-pressed="isSaved(product)" class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg" :class="isSaved(product) ? 'text-rose-600' : 'text-stone-600'">{{ isSaved(product) ? '♥' : '♡' }}</button>
              <button @click="buy(product)" class="absolute bottom-2 left-2 right-2 rounded-full bg-white/95 px-3 py-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-950 shadow-sm transition sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">{{ adding === product.id ? 'Added ✓' : 'Quick add +' }}</button>
            </div>
            <div class="pt-3"><p class="text-[9px] font-bold uppercase tracking-[.15em] text-stone-400">{{ product.category?.name || 'Store collection' }}</p><RouterLink :to="'/products/' + product.slug" class="mt-1.5 block min-h-10 text-xs font-semibold leading-5 text-stone-900 hover:text-stone-500 sm:text-sm">{{ product.name }}</RouterLink><p class="mt-2 text-sm font-black">{{ money(product.price) }} <span class="text-[10px] font-semibold text-stone-500">{{ product.currency || 'ETB' }}</span></p><button @click="buy(product)" class="mt-3 w-full rounded-full border border-stone-200 py-2.5 text-[10px] font-extrabold uppercase tracking-wider hover:border-stone-950 hover:bg-stone-950 hover:text-white sm:hidden">{{ adding === product.id ? 'Added ✓' : 'Add to bag +' }}</button></div>
          </article>
        </div>
        <div v-else-if="!error" class="mt-6 rounded-2xl border border-dashed border-stone-300 p-10 text-center"><p class="text-3xl text-stone-300">◇</p><h2 class="mt-3 text-lg font-black">No matching products</h2><p class="mt-2 text-sm text-stone-500">Try changing your search or filters to see more items.</p><button @click="clearFilters" class="mt-4 rounded-full bg-stone-950 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white">Clear filters</button></div>
        <div v-if="!loading && totalPages > 1" class="mt-8 flex items-center justify-center gap-3"><button :disabled="page <= 1" @click="page--" class="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold disabled:opacity-30">← Previous</button><span class="text-xs text-stone-500">Page {{ page }} of {{ totalPages }}</span><button :disabled="page >= totalPages" @click="page++" class="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold disabled:opacity-30">Next →</button></div>
      </section>
    </div>
  </div>
</template>
