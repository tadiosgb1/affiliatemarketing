<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../services/api'
import LoadingState from '../../components/ui/LoadingState.vue'

const products = ref([])
const savedIds = ref(JSON.parse(localStorage.getItem('marketflow-wishlist') || '[]'))
const loading = ref(true)
const error = ref('')
const money = value => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
const savedProducts = computed(() => products.value.filter(item => savedIds.value.some(id => String(id) === String(item.id))))
function remove(item) {
  savedIds.value = savedIds.value.filter(id => String(id) !== String(item.id))
  localStorage.setItem('marketflow-wishlist', JSON.stringify(savedIds.value))
}
onMounted(async () => {
  try {
    const response = await api.get('/products', { params: { limit: 100, page: 1 } })
    const data = response.data?.data ?? response.data?.products ?? response.data
    products.value = Array.isArray(data) ? data : (data?.rows || data?.items || data?.products || [])
  } catch (err) {
    error.value = err.response?.data?.message || 'We could not load your saved products.'
  } finally { loading.value = false }
})
</script>

<template>
  <section>
    <p class="text-[10px] font-extrabold uppercase tracking-[.25em] text-stone-500">{{ $t('wishlist.saved') }}</p>
    <h1 class="mt-2 text-4xl font-black tracking-[-.06em] sm:text-5xl">{{ $t('wishlist.title') }}<span class="ml-2 text-xl text-stone-400">({{ savedIds.length }})</span></h1>
    <p class="mt-3 text-sm text-stone-500">{{ $t('wishlist.description') }}</p>
    <p v-if="error" role="alert" class="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{{ error }}</p>
    <LoadingState v-if="loading"/>
    <div v-else-if="savedProducts.length" class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <article v-for="item in savedProducts" :key="item.id" class="min-w-0">
        <RouterLink :to="'/products/' + item.slug" class="block overflow-hidden rounded-xl bg-stone-100"><img v-if="item.imageUrl || item.image" :src="item.imageUrl || item.image" :alt="item.name" class="aspect-[3/4] w-full object-cover"/><div v-else class="flex aspect-[3/4] items-center justify-center text-4xl text-stone-300">♡</div></RouterLink>
        <p class="mt-3 text-sm font-semibold">{{ item.name }}</p>
        <p class="mt-1 text-sm font-black">{{ money(item.price) }} <span class="text-xs font-medium text-stone-500">{{ item.currency || 'ETB' }}</span></p>
        <div class="mt-3 flex items-center gap-3"><RouterLink :to="'/products/' + item.slug" class="rounded-full bg-stone-950 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white">{{ $t('wishlist.view_item') }}</RouterLink><button @click="remove(item)" class="text-xs font-semibold text-stone-500 underline underline-offset-4">Remove</button></div>
      </article>
    </div>
    <div v-else-if="!error" class="mt-8 rounded-2xl border border-dashed border-stone-300 p-12 text-center"><p class="text-3xl">♡</p><h2 class="mt-3 text-xl font-black">{{ $t('wishlist.empty_title') }}</h2><p class="mt-2 text-sm text-stone-500">{{ $t('wishlist.empty_description') }}</p><RouterLink to="/products" class="mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">{{ $t('wishlist.explore') }}</RouterLink></div>
  </section>
</template>