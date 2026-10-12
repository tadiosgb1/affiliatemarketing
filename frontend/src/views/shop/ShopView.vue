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
const sort = ref('newest')
const adding = ref('')
const notice = ref('')

const activeCategories = computed(() => categories.value.filter(item => !item.parentId || item.parentId === category.value))
const sortedProducts = computed(() => {
  const result = [...products.value]
  if (sort.value === 'price-low') result.sort((a, b) => Number(a.price) - Number(b.price))
  if (sort.value === 'price-high') result.sort((a, b) => Number(b.price) - Number(a.price))
  if (sort.value === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
  return result
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get('/products', { params: { q: search.value.trim() || undefined, categoryId: category.value || undefined } }),
      api.get('/categories'),
    ])
    products.value = productResponse.data?.data ?? productResponse.data?.products ?? []
    categories.value = categoryResponse.data?.data ?? categoryResponse.data?.categories ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'We could not load the catalog. Please try again in a moment.'
  } finally {
    loading.value = false
  }
}

function buy(product) {
  const added = addToCart(product)
  notice.value = added ? product.name + ' added to your bag.' : 'This item has no purchasable variant yet. Please contact the store.'
  adding.value = product.id
  window.setTimeout(() => { adding.value = '' }, 900)
}

onMounted(load)
</script>

<template>
  <section class="space-y-8">
    <div class="grid overflow-hidden rounded-3xl bg-rose-50 md:min-h-[330px] md:grid-cols-2">
      <div class="flex flex-col justify-center px-6 py-10 md:px-12 md:py-14">
        <p class="text-xs font-black uppercase tracking-[.25em] text-rose-600">The new season edit</p>
        <h1 class="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">Find your next<br class="hidden md:block"/> favourite.</h1>
        <p class="mt-4 max-w-md text-sm leading-6 text-slate-600 md:text-base">Discover everyday essentials, fresh styles and great finds picked for you.</p>
        <a href="#shop-products" class="mt-7 inline-flex w-fit rounded-full bg-slate-950 px-7 py-3 text-sm font-bold text-white transition hover:bg-rose-600">Shop collection <span class="ml-2">→</span></a>
      </div>
      <div class="relative flex min-h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-rose-200 via-orange-100 to-amber-100 p-8">
        <div class="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[32px] border-white/30"></div>
        <div class="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/25"></div>
        <div class="relative max-w-xs text-center">
          <p class="text-xs font-black uppercase tracking-[.3em] text-rose-700">Style starts here</p>
          <p class="mt-3 text-5xl font-black leading-none text-slate-900 md:text-7xl">NEW<br/>MOOD</p>
          <p class="mt-4 text-sm font-semibold text-slate-700">Your style. Your story.</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="rounded-2xl border bg-white p-4"><p class="text-lg">✦</p><p class="mt-2 text-sm font-bold">New finds</p><p class="mt-1 text-xs text-slate-500">Fresh additions to explore</p></div>
      <div class="rounded-2xl border bg-white p-4"><p class="text-lg">♡</p><p class="mt-2 text-sm font-bold">Everyday style</p><p class="mt-1 text-xs text-slate-500">Easy-to-wear essentials</p></div>
      <div class="rounded-2xl border bg-white p-4"><p class="text-lg">↗</p><p class="mt-2 text-sm font-bold">Share & earn</p><p class="mt-1 text-xs text-slate-500">Affiliate opportunities</p></div>
      <div class="rounded-2xl border bg-white p-4"><p class="text-lg">✓</p><p class="mt-2 text-sm font-bold">Simple checkout</p><p class="mt-1 text-xs text-slate-500">A smooth shopping journey</p></div>
    </div>

    <div id="shop-products" class="scroll-mt-24">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-xs font-black uppercase tracking-[.2em] text-rose-600">Made for your wishlist</p>
          <h2 class="mt-2 text-3xl font-black tracking-tight">Explore the collection</h2>
          <p class="mt-2 text-sm text-slate-500">Find something you’ll love, at a price that feels right.</p>
        </div>
        <p class="text-sm font-semibold text-slate-500">{{ loading ? 'Loading items…' : products.length + ' items' }}</p>
      </div>

      <div class="mt-5 flex flex-col gap-3 md:flex-row">
        <form class="flex flex-1 gap-2" @submit.prevent="load">
          <input v-model="search" aria-label="Search products" placeholder="Search clothes, accessories and more…" class="min-w-0 flex-1 rounded-full border bg-white px-5 py-3 text-sm outline-none focus:border-rose-400"/>
          <button class="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-rose-600">Search</button>
        </form>
        <select v-model="category" aria-label="Filter category" @change="load" class="rounded-full border bg-white px-4 py-3 text-sm">
          <option value="">All categories</option>
          <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.parentId ? '↳ ' : '' }}{{ item.name }}</option>
        </select>
        <select v-model="sort" aria-label="Sort products" class="rounded-full border bg-white px-4 py-3 text-sm">
          <option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name A–Z</option>
        </select>
      </div>

      <p v-if="notice" role="status" class="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{{ notice }}</p>
      <p v-if="error" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <LoadingState v-if="loading"/>
      <div v-else-if="sortedProducts.length" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
        <article v-for="(product, index) in sortedProducts" :key="product.id" class="group min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
          <RouterLink :to="'/products/' + product.slug" class="block">
            <div class="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-stone-100 via-rose-50 to-slate-100">
              <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
              <div v-else class="flex h-full flex-col items-center justify-center p-3 text-center">
                <span class="text-4xl text-rose-300">{{ ['✦','◇','♡','◌'][index % 4] }}</span>
                <span class="mt-3 text-xs font-bold text-slate-400">MARKETFLOW EDIT</span>
              </div>
              <span class="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">Just in</span>
            </div>
            <div class="p-3 md:p-4">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ product.category?.name || 'Discover' }}</p>
              <h3 class="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">{{ product.name }}</h3>
              <p class="mt-2 text-base font-black text-slate-950">{{ Number(product.price || 0).toLocaleString() }} <span class="text-xs font-semibold">{{ product.currency || 'ETB' }}</span></p>
            </div>
          </RouterLink>
          <div class="px-3 pb-3 md:px-4 md:pb-4">
            <button @click="buy(product)" class="w-full rounded-full border border-slate-300 py-2.5 text-xs font-bold transition hover:border-slate-950 hover:bg-slate-950 hover:text-white">{{ adding === product.id ? 'Added ✓' : 'Add to bag +' }}</button>
          </div>
        </article>
      </div>
      <div v-else class="mt-6 rounded-2xl border border-dashed p-10 text-center">
        <p class="text-2xl">♡</p><h3 class="mt-3 text-lg font-black">Nothing here just yet</h3><p class="mt-2 text-sm text-slate-500">Try another search or check back soon for new arrivals.</p>
        <button class="mt-4 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white" @click="search = ''; category = ''; load()">Clear filters</button>
      </div>
    </div>
  </section>
</template>
