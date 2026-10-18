<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../services/api'
import LoadingState from '../../components/ui/LoadingState.vue'

const products = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const money = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const productList = value => Array.isArray(value) ? value : (value?.rows || value?.items || value?.products || [])
const categoryList = value => Array.isArray(value) ? value : (value?.rows || value?.items || value?.categories || [])
const categoryImages = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80',
]
const featured = computed(() => products.value.slice(0, 8))
const topCategories = computed(() => categories.value.filter(item => !item.parentId).slice(0, 4))
const countFor = category => products.value.filter(p => p.categoryId === category.id || p.category?.id === category.id).length

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get('/products', { params: { limit: 8, page: 1 } }),
      api.get('/categories'),
    ])
    products.value = productList(productResponse.data?.data ?? productResponse.data?.products ?? productResponse.data)
    categories.value = categoryList(categoryResponse.data?.data ?? categoryResponse.data?.categories ?? categoryResponse.data)
  } catch (err) {
    error.value = err.response?.data?.message || 'We could not load the live catalog. Please try again.'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="space-y-14 md:space-y-20">
    <section class="relative isolate overflow-hidden rounded-[1.5rem] bg-[#d6cec2]">
      <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=90" alt="Fashion campaign showing the latest style" fetchpriority="high" class="absolute inset-0 -z-20 h-full w-full object-cover object-center"/>
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/35 to-black/0"></div>
      <div class="flex min-h-[470px] items-center px-6 py-12 sm:px-10 md:min-h-[600px] md:px-16 lg:px-20">
        <div class="max-w-2xl text-white">
          <p class="text-[10px] font-extrabold uppercase tracking-[.32em] text-white/80 sm:text-xs">{{ $t('home.season') }}</p>
          <h1 class="mt-5 text-5xl font-black leading-[.94] tracking-[-.07em] sm:text-6xl md:text-8xl">{{ $t('home.tagline') }}</h1>
          <p class="mt-6 max-w-md text-sm leading-6 text-white/85 sm:text-base sm:leading-7">{{ $t('home.intro') }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink to="/products" class="rounded-full bg-white px-7 py-4 text-[10px] font-extrabold uppercase tracking-[.15em] text-stone-950 transition hover:bg-amber-100">{{ $t('home.shop_all') }} <span class="ml-3">↗</span></RouterLink>
            <RouterLink to="/categories" class="rounded-full border border-white/70 bg-white/10 px-7 py-4 text-[10px] font-extrabold uppercase tracking-[.15em] text-white backdrop-blur transition hover:bg-white/20">{{ $t('home.browse_categories') }}</RouterLink>
          </div>
          <div class="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[9px] font-bold uppercase tracking-[.18em] text-white/70 sm:text-[10px]"><span>{{ $t('home.new_discoveries') }}</span><span>{{ $t('home.essentials') }}</span><span>{{ $t('home.easy_shopping') }}</span></div>
        </div>
      </div>
      <div class="absolute bottom-5 right-6 hidden rounded-full border border-white/40 px-4 py-2 text-[9px] font-bold uppercase tracking-[.2em] text-white md:block">{{ $t('home.discover') }} · Choose · Enjoy</div>
    </section>

    <section>
      <div class="flex items-end justify-between gap-4">
        <div><p class="text-[10px] font-extrabold uppercase tracking-[.25em] text-stone-500">{{ $t('home.browse_your_way') }}</p><h2 class="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">{{ $t('home.categories') }}</h2></div>
        <RouterLink to="/categories" class="shrink-0 pb-1 text-[10px] font-extrabold uppercase tracking-wider underline underline-offset-4">{{ $t('home.all_categories') }} ↗</RouterLink>
      </div>
      <div v-if="categories.length" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        <RouterLink v-for="(item, index) in topCategories" :key="item.id" :to="{ path: '/products', query: { categoryId: item.id } }" class="group relative isolate min-h-56 overflow-hidden rounded-xl bg-stone-200 sm:min-h-80">
          <img :src="item.imageUrl || item.image || categoryImages[index % categoryImages.length]" :alt="item.name" loading="lazy" class="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"/>
          <div class="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/0 to-black/0"></div>
          <div class="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5"><p class="text-[9px] font-bold uppercase tracking-[.18em] text-white/70">{{ $t('home.explore_collection') }}</p><h3 class="mt-1 text-lg font-black tracking-tight sm:text-2xl">{{ item.name }}</h3><p class="mt-2 text-[10px] font-semibold uppercase tracking-wider">{{ $t('home.shop_category') }} ↗</p></div>
        </RouterLink>
      </div>
      <div v-else-if="!loading && !error" class="mt-6 rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">{{ $t('home.categories_empty') }}</div>
    </section>

    <section>
      <div class="flex items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div><p class="text-[10px] font-extrabold uppercase tracking-[.25em] text-stone-500">{{ $t('home.catalog_picks') }}</p><h2 class="mt-2 text-3xl font-black tracking-[-.05em] sm:text-4xl">{{ $t('home.fresh_finds') }}</h2></div>
        <RouterLink to="/products" class="shrink-0 pb-1 text-[10px] font-extrabold uppercase tracking-wider underline underline-offset-4">{{ $t('home.view_all') }} ↗</RouterLink>
      </div>
      <p v-if="error" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ error }} <button @click="load" class="ml-2 font-bold underline">Try again</button></p>
      <LoadingState v-if="loading"/>
      <div v-else-if="featured.length" class="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
        <RouterLink v-for="product in featured" :key="product.id" :to="'/products/' + product.slug" class="group min-w-0">
          <div class="relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100">
            <img v-if="product.imageUrl || product.image" :src="product.imageUrl || product.image" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105"/>
            <div v-else class="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-[#e8dfd4] text-4xl text-stone-400">✳</div>
            <span class="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wider">{{ $t('home.discover') }}</span>
          </div>
          <p class="mt-3 text-[9px] font-bold uppercase tracking-[.15em] text-stone-400">{{ product.category?.name || 'Store collection' }}</p>
          <h3 class="mt-1 text-sm font-semibold leading-5 text-stone-900 group-hover:text-stone-500">{{ product.name }}</h3>
          <p class="mt-2 text-sm font-black">{{ money(product.price) }} <span class="text-[10px] font-semibold text-stone-500">{{ product.currency || 'ETB' }}</span></p>
        </RouterLink>
      </div>
      <div v-else-if="!loading && !error" class="mt-6 rounded-xl border border-dashed border-stone-300 p-10 text-center"><p class="font-bold">Your collection is waiting.</p><p class="mt-2 text-sm text-stone-500">Add products through the store management dashboard to show them here.</p><RouterLink to="/products" class="mt-4 inline-block font-bold underline">Browse catalog</RouterLink></div>
    </section>

    <section class="grid overflow-hidden rounded-2xl bg-[#e8e1d7] md:grid-cols-2">
      <div class="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><p class="text-[10px] font-extrabold uppercase tracking-[.25em] text-stone-500">A better way to discover</p><h2 class="mt-4 text-3xl font-black leading-tight tracking-[-.06em] sm:text-5xl">Your next favourite<br/>is closer than ever.</h2><p class="mt-4 max-w-md text-sm leading-6 text-stone-600">Explore the complete catalog, compare prices, choose options, and keep the things you love together in your cart.</p><RouterLink to="/products" class="mt-7 inline-flex w-fit rounded-full bg-stone-950 px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-stone-700">Start exploring ↗</RouterLink></div>
      <div class="relative min-h-64"><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85" alt="Modern retail store interior" loading="lazy" class="absolute inset-0 h-full w-full object-cover"/></div>
    </section>
  </div>
</template>
