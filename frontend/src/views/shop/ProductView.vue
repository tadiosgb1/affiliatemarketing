<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { addToCart } from '../../stores'
import api from '../../services/api'

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const error = ref('')
const selectedVariantId = ref('')
const notice = ref('')
const variants = computed(() => (product.value?.variants || []).filter(variant => variant.status === 'active'))
const selectedVariant = computed(() => variants.value.find(variant => variant.id === selectedVariantId.value) || variants.value[0] || null)
const optionLabels = variant => (variant?.options || []).map(option => option.value?.label || option.value?.value).filter(Boolean).join(' / ')

async function loadProduct() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/products/' + route.params.slug)
    product.value = response.data?.data ?? response.data
    selectedVariantId.value = product.value?.variants?.find(variant => variant.status === 'active')?.id || ''
  } catch (err) {
    product.value = null
    error.value = err.response?.data?.message || 'We could not load this product.'
  } finally {
    loading.value = false
  }
}

function addSelectedToCart() {
  if (!product.value || !selectedVariant.value) {
    notice.value = 'This product is not available to purchase right now.'
    return
  }
  const added = addToCart(product.value, selectedVariant.value)
  notice.value = added ? 'Added to your bag.' : 'Could not add this item. Please choose an available option.'
}

watch(() => route.params.slug, loadProduct)
onMounted(loadProduct)
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-slate-500">Loading product…</div>
  <div v-else-if="!product" class="mx-auto max-w-xl py-20 text-center">
    <h1 class="text-2xl font-black">Product not found</h1>
    <p class="mt-2 text-sm text-slate-500">{{ error || 'This item may no longer be available.' }}</p>
    <RouterLink to="/shop" class="mt-5 inline-block rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">Back to shop</RouterLink>
  </div>
  <section v-else class="grid gap-8 md:grid-cols-2 md:gap-12">
    <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 to-slate-100">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="aspect-[4/5] w-full object-cover"/>
      <div v-else class="flex aspect-[4/5] flex-col items-center justify-center text-rose-300"><span class="text-7xl">✦</span><span class="mt-4 text-xs font-black tracking-[.3em]">MARKETFLOW EDIT</span></div>
    </div>
    <div class="py-2 md:py-6">
      <p class="text-xs font-black uppercase tracking-[.2em] text-rose-600">{{ product.category?.name || 'The collection' }}</p>
      <h1 class="mt-3 text-3xl font-black tracking-tight md:text-4xl">{{ product.name }}</h1>
      <p class="mt-4 text-2xl font-black">{{ Number(selectedVariant?.price ?? product.price ?? 0).toLocaleString() }} <span class="text-sm font-semibold">{{ product.currency || 'ETB' }}</span></p>
      <p class="mt-5 leading-7 text-slate-600">{{ product.description || 'A new find from the MarketFlow collection.' }}</p>

      <div v-if="variants.length > 1" class="mt-7">
        <label for="product-variant" class="mb-2 block text-sm font-bold">Choose style / size</label>
        <select id="product-variant" v-model="selectedVariantId" class="w-full rounded-xl border bg-white px-4 py-3">
          <option v-for="variant in variants" :key="variant.id" :value="variant.id">{{ optionLabels(variant) || variant.sku }} · {{ Number(variant.price ?? product.price).toLocaleString() }} {{ product.currency || 'ETB' }}</option>
        </select>
      </div>
      <p v-if="notice" role="status" class="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800">{{ notice }}</p>
      <button :disabled="!selectedVariant" @click="addSelectedToCart" class="mt-7 w-full rounded-full bg-slate-950 px-6 py-4 font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50">Add to bag · {{ Number(selectedVariant?.price ?? product.price ?? 0).toLocaleString() }} {{ product.currency || 'ETB' }}</button>
      <div class="mt-6 space-y-3 border-t pt-5 text-sm text-slate-500"><p>✓ Secure checkout flow</p><p>✓ Track your orders from your account</p><p>✓ Share eligible products through our affiliate program</p></div>
    </div>
  </section>
</template>
