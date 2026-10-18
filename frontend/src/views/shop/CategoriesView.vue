<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../services/api'
import LoadingState from '../../components/ui/LoadingState.vue'

const categories = ref([])
const products = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const categoryImages = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80',
]
const list = value => Array.isArray(value) ? value : (value?.rows || value?.items || value?.categories || value?.products || [])
const filtered = computed(() => categories.value.filter(item => String(item.name || '').toLowerCase().includes(search.value.toLowerCase().trim())))
const productCount = item => products.value.filter(p => p.categoryId === item.id || p.category?.id === item.id).length
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [categoryResponse, productResponse] = await Promise.all([api.get('/categories'), api.get('/products', { params: { limit: 100, page: 1 } })])
    categories.value = list(categoryResponse.data?.data ?? categoryResponse.data?.categories ?? categoryResponse.data)
    products.value = list(productResponse.data?.data ?? productResponse.data?.products ?? productResponse.data)
  } catch (err) {
    error.value = err.response?.data?.message || 'We could not load categories from the store.'
  } finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <section>
    <div class="relative isolate overflow-hidden rounded-2xl bg-[#e8e1d7] px-6 py-10 sm:px-10 md:py-14">
      <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80" alt="Curated fashion collection" class="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-35"/>
      <div class="absolute inset-0 -z-10 bg-gradient-to-r from-[#fbfaf8]/95 via-[#fbfaf8]/80 to-[#fbfaf8]/15"></div>
      <p class="text-[10px] font-extrabold uppercase tracking-[.28em] text-stone-500">{{ $t('categories.find') }}</p>
      <h1 class="mt-3 text-4xl font-black tracking-[-.06em] sm:text-6xl">{{ $t('categories.title') }}</h1>
      <p class="mt-4 max-w-xl text-sm leading-6 text-stone-600">{{ $t('categories.description') }}</p>
      <label class="mt-6 block max-w-md"><span class="sr-only">Search categories</span><input v-model="search" placeholder=:placeholder="$t('categories.search')" aria-label="Search categories" class="!rounded-full !border-stone-300 !bg-white/90 !px-5"/></label>
    </div>
    <p v-if="error" role="alert" class="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ error }} <button @click="load" class="font-bold underline">Try again</button></p>
    <LoadingState v-if="loading"/>
    <div v-else-if="filtered.length" class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <RouterLink v-for="(item, index) in filtered" :key="item.id" :to="{ path: '/products', query: { categoryId: item.id } }" class="group overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
        <div class="relative aspect-[4/5] overflow-hidden bg-stone-100">
          <img :src="item.imageUrl || item.image || categoryImages[index % categoryImages.length]" :alt="item.name" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <span class="absolute bottom-3 left-3 right-3 text-lg font-black tracking-tight text-white sm:text-xl">{{ item.name }}</span>
        </div>
        <div class="flex items-center justify-between gap-2 p-3 sm:p-4"><span class="text-[10px] font-semibold text-stone-500">{{ productCount(item) }} {{ productCount(item) === 1 ? 'product' : 'products' }} in loaded catalog</span><span class="text-lg transition group-hover:translate-x-1">↗</span></div>
      </RouterLink>
    </div>
    <div v-else-if="!error" class="mt-8 rounded-2xl border border-dashed border-stone-300 p-12 text-center"><h2 class="text-xl font-black">{{ $t('categories.no_results') }}</h2><p class="mt-2 text-sm text-stone-500">{{ $t('categories.try_search') }}</p><RouterLink to="/products" class="mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">{{ $t('categories.browse') }}</RouterLink></div>
  </section>
</template>
