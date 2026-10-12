<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../services/api'

const stats = ref({ products: 0, categories: 0, subcategories: 0 })
const loading = ref(true)
const error = ref('')

const sections = [
  { title: 'Products', description: 'Create, edit and publish products, pricing, variants and stock.', path: '/admin/products', icon: '▦' },
  { title: 'Categories & subcategories', description: 'Build the category tree customers browse in the storefront.', path: '/admin/categories', icon: '▤' },
  { title: 'Payments', description: 'Review payment records and statuses.', path: '/admin/payments', icon: '↗' },
  { title: 'Affiliate program', description: 'Open affiliate links, commissions and referral tools.', path: '/affiliate', icon: '◎' },
  { title: 'Customer storefront', description: 'Preview the shopping experience customers see.', path: '/shop', icon: '⌂' },
]

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    const [productResponse, categoryResponse] = await Promise.all([
      api.get('/products'),
      api.get('/categories'),
    ])
    const products = productResponse.data?.data ?? productResponse.data?.products ?? []
    const categories = categoryResponse.data?.data ?? categoryResponse.data?.categories ?? []
    stats.value = {
      products: products.length,
      categories: categories.filter(category => !category.parentId).length,
      subcategories: categories.filter(category => Boolean(category.parentId)).length,
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load live catalog statistics. Check the backend connection.'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <section class="space-y-8">
    <header class="rounded-3xl bg-slate-950 p-7 text-white md:p-10">
      <p class="text-sm font-bold uppercase tracking-[.2em] text-indigo-300">MarketFlow · Administration</p>
      <div class="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 class="text-3xl font-black md:text-4xl">Commerce control center</h1>
          <p class="mt-3 max-w-2xl text-slate-300">Manage your catalog and merchandising from here. Changes made in management pages are saved through the backend API.</p>
        </div>
        <button class="rounded-xl bg-white px-4 py-2.5 font-bold text-slate-950" @click="loadStats">Refresh data</button>
      </div>
    </header>

    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="grid gap-4 sm:grid-cols-3">
      <article class="rounded-2xl border bg-white p-5">
        <p class="text-sm font-semibold text-slate-500">Products in catalog</p>
        <p class="mt-2 text-3xl font-black">{{ loading ? '…' : stats.products }}</p>
        <RouterLink to="/admin/products" class="mt-3 inline-block text-sm font-bold text-indigo-600">Manage products →</RouterLink>
      </article>
      <article class="rounded-2xl border bg-white p-5">
        <p class="text-sm font-semibold text-slate-500">Top-level categories</p>
        <p class="mt-2 text-3xl font-black">{{ loading ? '…' : stats.categories }}</p>
        <RouterLink to="/admin/categories" class="mt-3 inline-block text-sm font-bold text-indigo-600">Manage categories →</RouterLink>
      </article>
      <article class="rounded-2xl border bg-white p-5">
        <p class="text-sm font-semibold text-slate-500">Subcategories</p>
        <p class="mt-2 text-3xl font-black">{{ loading ? '…' : stats.subcategories }}</p>
        <RouterLink to="/admin/categories" class="mt-3 inline-block text-sm font-bold text-indigo-600">Manage hierarchy →</RouterLink>
      </article>
    </div>

    <div>
      <h2 class="text-xl font-black">Management tools</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RouterLink v-for="section in sections" :key="section.title" :to="section.path" class="group rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl font-black text-indigo-700">{{ section.icon }}</div>
          <h3 class="mt-4 font-black">{{ section.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-500">{{ section.description }}</p>
          <p class="mt-4 text-sm font-bold text-indigo-600">Open section →</p>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
