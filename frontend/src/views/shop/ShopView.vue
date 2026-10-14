<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../services/api'
import { addToCart } from '../../stores'
import LoadingState from '../../components/ui/LoadingState.vue'

const products = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const category = ref('')
const search = ref('')
const sort = ref('featured')
const adding = ref('')
const notice = ref('')
const wishlist = ref(JSON.parse(localStorage.getItem('marketflow-wishlist') || '[]'))

const categoryItems = computed(() => categories.value.filter(item => !item.parentId || item.parentId === category.value))
const visibleProducts = computed(() => {
  const result = [...products.value]
  if (sort.value === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price))
  if (sort.value === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price))
  if (sort.value === 'name') result.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  if (sort.value === 'newest') result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  return result
})
const featuredProducts = computed(() => visibleProducts.value.slice(0, 4))
const money = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const isSaved = product => wishlist.value.includes(product.id)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get('/products', { params: { q: search.value.trim() || undefined, categoryId: category.value || undefined } }),
      api.get('/categories'),
    ])
    const productData = productResponse.data?.data ?? productResponse.data?.products ?? []
    products.value = Array.isArray(productData) ? productData : (productData?.rows || productData?.items || [])
    const categoryData = categoryResponse.data?.data ?? categoryResponse.data?.categories ?? []
    categories.value = Array.isArray(categoryData) ? categoryData : (categoryData?.rows || [])
  } catch (err) {
    error.value = err.response?.data?.message || 'We couldn’t reach the store right now. Check your connection and try again.'
  } finally {
    loading.value = false
  }
}

function buy(product) {
  const added = addToCart(product)
  notice.value = added ? product.name + ' was added to your bag.' : 'This product has no active purchasable option yet.'
  adding.value = product.id
  window.setTimeout(() => { adding.value = '' }, 1000)
}
function toggleSaved(product) {
  wishlist.value = isSaved(product) ? wishlist.value.filter(id => id !== product.id) : [...wishlist.value, product.id]
  localStorage.setItem('marketflow-wishlist', JSON.stringify(wishlist.value))
}
function chooseCategory(id) {
  category.value = id
  load()
}
onMounted(load)
</script>

<template>
  <div class="space-y-12 md:space-y-16">
    <section class="relative isolate overflow-hidden rounded-[1.75rem] bg-[#eee7df]">
      <img
        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=85"
        alt="Fashion editorial featuring the new season"
        fetchpriority="high"
        class="absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-[#171717]/80 via-[#171717]/45 to-transparent"></div>
      <div class="flex min-h-[470px] items-end px-6 py-10 sm:px-10 md:min-h-[560px] md:items-center md:px-16 md:py-16">
        <div class="max-w-2xl text-white">
          <p class="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.32em] text-white/80 sm:text-xs">
            <span class="h-px w-8 bg-white/70"></span> The new season edit
          </p>
          <h1 class="mt-5 max-w-xl text-5xl font-black leading-[.96] tracking-[-.065em] sm:text-6xl md:text-7xl lg:text-8xl">Good style.<br/>Great finds.</h1>
          <p class="mt-5 max-w-md text-sm leading-6 text-white/85 sm:text-base sm:leading-7">Discover the pieces you’ll reach for on repeat. Explore the store’s latest products, all in one place.</p>
          <a href="#shop-products" class="mt-7 inline-flex items-center gap-5 rounded-full bg-white px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-amber-200 sm:mt-9 sm:px-7">Shop the collection <span class="text-lg">↗</span></a>
          <div class="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-semibold uppercase tracking-[.16em] text-white/75 sm:text-xs">
            <span>Curated finds</span><span class="h-1 w-1 rounded-full bg-white/60"></span><span>Everyday essentials</span><span class="h-1 w-1 rounded-full bg-white/60"></span><span>Made for you</span>
          </div>
        </div>
      </div>
      <div class="absolute bottom-5 right-6 hidden text-right text-white/75 md:block">
        <p class="text-[10px] font-bold uppercase tracking-[.22em]">Your next favourite</p>
        <p class="mt-1 text-xs">is waiting to be found.</p>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 sm:grid-cols-4">
      <div class="bg-white p-4 sm:p-5"><p class="text-[10px] font-bold uppercase tracking-[.18em] text-stone-400">01 / Discover</p><p class="mt-2 text-sm font-bold text-stone-900 sm:text-base">Fresh finds</p><p class="mt-1 text-xs leading-5 text-stone-500">Explore the live collection.</p></div>
      <div class="bg-white p-4 sm:p-5"><p class="text-[10px] font-bold uppercase tracking-[.18em] text-stone-400">02 / Choose</p><p class="mt-2 text-sm font-bold text-stone-900 sm:text-base">Your own edit</p><p class="mt-1 text-xs leading-5 text-stone-500">Filter and find your fit.</p></div>
      <div class="bg-white p-4 sm:p-5"><p class="text-[10px] font-bold uppercase tracking-[.18em] text-stone-400">03 / Checkout</p><p class="mt-2 text-sm font-bold text-stone-900 sm:text-base">Easy shopping</p><p class="mt-1 text-xs leading-5 text-stone-500">Keep your picks in one bag.</p></div>
      <div class="bg-white p-4 sm:p-5"><p class="text-[10px] font-bold uppercase tracking-[.18em] text-stone-400">04 / Share</p><p class="mt-2 text-sm font-bold text-stone-900 sm:text-base">Shop & share</p><p class="mt-1 text-xs leading-5 text-stone-500">Explore the affiliate program.</p></div>
    </section>

    <section id="shop-products" class="scroll-mt-24">
      <div class="flex flex-col justify-between gap-5 border-b border-stone-200 pb-6 md:flex-row md:items-end">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[.28em] text-stone-500">The store collection</p>
          <h2 class="mt-3 text-3xl font-black tracking-[-.05em] text-stone-950 sm:text-4xl md:text-5xl">Find your thing.</h2>
          <p class="mt-3 max-w-lg text-sm leading-6 text-stone-500">Real products from the store catalog. Browse by category, search what you want, and save the pieces you love.</p>
        </div>
        <p class="shrink-0 text-xs font-semibold uppercase tracking-wider text-stone-500">{{ loading ? 'Updating collection…' : products.length + (products.length === 1 ? ' product' : ' products') }}</p>
      </div>

      <div class="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form class="flex min-w-0 flex-1 gap-2" @submit.prevent="load">
          <label class="relative min-w-0 flex-1">
            <span class="sr-only">Search the catalog</span>
            <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">⌕</span>
            <input v-model="search" aria-label="Search products" placeholder="Search the collection…" class="!min-h-12 !rounded-full !border-stone-200 !bg-white !pl-10 !pr-4 !text-sm"/>
          </label>
          <button class="min-h-12 rounded-full bg-stone-950 px-6 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-stone-700">Search</button>
        </form>
        <div class="flex gap-2">
          <label class="min-w-0 flex-1 lg:w-48">
            <span class="sr-only">Sort products</span>
            <select v-model="sort" aria-label="Sort products" class="!min-h-12 !rounded-full !border-stone-200 !bg-white !px-4 !text-xs">
              <option value="featured">Recommended</option><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name A–Z</option>
            </select>
          </label>
          <label class="min-w-0 flex-1 lg:w-48">
            <span class="sr-only">Filter by category</span>
            <select v-model="category" aria-label="Filter by category" @change="load" class="!min-h-12 !rounded-full !border-stone-200 !bg-white !px-4 !text-xs">
              <option value="">All categories</option>
              <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.parentId ? '↳ ' : '' }}{{ item.name }}</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="categories.length" class="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button @click="chooseCategory('')" :class="!category ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-500'" class="shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition">Everything</button>
        <button v-for="item in categoryItems" :key="item.id" @click="chooseCategory(item.id)" :class="category === item.id ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-500'" class="shrink-0 rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition">{{ item.name }}</button>
      </div>

      <p v-if="notice" role="status" class="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{{ notice }} <RouterLink to="/cart" class="ml-2 underline underline-offset-2">View bag →</RouterLink></p>
      <div v-if="error" role="alert" class="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
        <div><p class="font-bold text-red-900">The collection couldn’t load</p><p class="mt-1 text-sm text-red-700">{{ error }}</p></div>
        <button @click="load" class="rounded-full bg-red-900 px-5 py-2.5 text-xs font-bold text-white">Try again</button>
      </div>
      <LoadingState v-if="loading"/>
      <div v-else-if="visibleProducts.length" class="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
        <article v-for="(product, index) in visibleProducts" :key="product.id" class="group min-w-0">
          <div class="relative overflow-hidden rounded-xl bg-stone-100">
            <RouterLink :to="'/products/' + product.slug" class="block">
              <div class="aspect-[3/4] overflow-hidden">
                <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.045]"/>
                <div v-else class="flex h-full flex-col items-center justify-center bg-gradient-to-br from-stone-100 via-[#eee7df] to-stone-200 text-stone-400">
                  <span class="text-5xl">{{ ['✳','◇','◯','✦'][index % 4] }}</span><span class="mt-3 text-[9px] font-bold uppercase tracking-[.25em]">Store collection</span>
                </div>
              </div>
            </RouterLink>
            <span class="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-stone-700 sm:left-3 sm:top-3">Shop now</span>
            <button @click="toggleSaved(product)" :aria-label="isSaved(product) ? 'Remove from saved items' : 'Save item'" :aria-pressed="isSaved(product)" class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg transition hover:scale-105 sm:right-3 sm:top-3" :class="isSaved(product) ? 'text-rose-600' : 'text-stone-600'">{{ isSaved(product) ? '♥' : '♡' }}</button>
            <button @click="buy(product)" class="absolute bottom-2 left-2 right-2 translate-y-2 rounded-full bg-white/95 px-3 py-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-950 opacity-100 shadow-sm transition sm:bottom-3 sm:left-3 sm:right-3 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">{{ adding === product.id ? 'Added to bag ✓' : 'Quick add +' }}</button>
          </div>
          <div class="pt-3 sm:pt-4">
            <p class="text-[9px] font-bold uppercase tracking-[.16em] text-stone-400">{{ product.category?.name || 'The collection' }}</p>
            <RouterLink :to="'/products/' + product.slug" class="mt-1.5 block min-h-10 text-xs font-semibold leading-5 text-stone-900 transition hover:text-stone-500 sm:text-sm">{{ product.name }}</RouterLink>
            <div class="mt-2 flex items-center justify-between gap-2">
              <p class="text-sm font-black tracking-tight text-stone-950 sm:text-base">{{ money(product.price) }} <span class="text-[10px] font-semibold text-stone-500">{{ product.currency || 'ETB' }}</span></p>
              <span v-if="isSaved(product)" class="text-[9px] font-bold uppercase tracking-wider text-rose-600">Saved</span>
            </div>
            <button @click="buy(product)" class="mt-3 w-full rounded-full border border-stone-200 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-800 transition hover:border-stone-950 hover:bg-stone-950 hover:text-white sm:hidden">{{ adding === product.id ? 'Added ✓' : 'Add to bag +' }}</button>
          </div>
        </article>
      </div>
      <div v-else-if="!error" class="mt-7 rounded-2xl border border-dashed border-stone-300 px-5 py-16 text-center">
        <p class="text-4xl text-stone-300">◇</p><h3 class="mt-4 text-xl font-black tracking-tight text-stone-900">Your next find is still out there.</h3><p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">No products match those filters right now. Try another search or browse everything.</p>
        <button @click="search = ''; category = ''; load()" class="mt-5 rounded-full bg-stone-950 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white">Clear filters</button>
      </div>
    </section>

    <section class="grid overflow-hidden rounded-2xl bg-[#e7e0d6] md:grid-cols-2">
      <div class="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-12 md:py-14">
        <p class="text-[10px] font-extrabold uppercase tracking-[.25em] text-stone-500">More than a shopping bag</p>
        <h2 class="mt-4 max-w-md text-3xl font-black leading-tight tracking-[-.05em] text-stone-950 sm:text-4xl">Love a find?<br/>Share the feeling.</h2>
        <p class="mt-4 max-w-md text-sm leading-6 text-stone-600">Explore the affiliate experience and discover how sharing eligible products can connect your community with things they love.</p>
        <RouterLink to="/affiliate" class="mt-6 inline-flex w-fit items-center gap-4 rounded-full bg-stone-950 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-stone-700">Explore affiliate <span class="text-base">↗</span></RouterLink>
      </div>
      <div class="relative min-h-64 overflow-hidden md:min-h-[360px]">
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" alt="Thoughtfully arranged fashion store" loading="lazy" class="absolute inset-0 h-full w-full object-cover"/>
        <div class="absolute inset-0 bg-stone-950/10"></div>
        <div class="absolute bottom-5 left-5 rounded-xl bg-white/90 px-4 py-3 backdrop-blur">
          <p class="text-[9px] font-extrabold uppercase tracking-[.2em] text-stone-500">Your style, your circle</p><p class="mt-1 text-sm font-bold text-stone-900">Discover. Save. Share.</p>
        </div>
      </div>
    </section>
  </div>
</template>
