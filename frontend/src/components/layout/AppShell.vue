<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { auth, cartCount, logout } from '../../stores'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()
const mobile = ref(false)
const categoryOpen = ref(false)
const accountOpen = ref(false)
const searchText = ref(String(route.query.q || ''))
const categories = ref([])
const products = ref([])
const activeCategory = ref(null)
const expandedCategoryIds = ref([])
const brand = ref({ platformName: '', name: '', tagline: '', logoUrl: '', primaryColor: '#171717' })
const brandName = computed(() => brand.value.platformName || brand.value.name || 'MarketFlow')
const roleSlugs = computed(() => (auth.user?.roles || []).map(role => typeof role === 'string' ? role : role.slug))
const canManage = computed(() => ['admin', 'company_staff'].includes(String(auth.user?.role || '').toLowerCase()) || roleSlugs.value.some(item => !['customer', 'affiliate'].includes(item)) || (auth.user?.permissions || []).some(permission => permission.endsWith('.manage') || permission === 'dashboard.view'))
const parentIdOf = item => item.parentId ?? item.parent_id ?? item.parent?.id ?? item.parentCategoryId ?? null
const topCategories = computed(() => categories.value.filter(item => !parentIdOf(item)))
const childrenOf = item => categories.value.filter(child => String(parentIdOf(child) ?? '') === String(item.id))
const hasChildren = item => childrenOf(item).length > 0
const megaCategoryRows = computed(() => {
  const rows = []
  const roots = topCategories.value
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
  visit(roots.length ? roots : categories.value)
  return rows
})
function toggleCategory(item) {
  const id = String(item.id)
  expandedCategoryIds.value = expandedCategoryIds.value.includes(id) ? expandedCategoryIds.value.filter(value => value !== id) : [...expandedCategoryIds.value, id]
  activeCategory.value = item
}
const categoryProducts = computed(() => {
  if (!activeCategory.value) return products.value.slice(0, 6)
  const id = String(activeCategory.value.id)
  return products.value.filter(product => String(product.categoryId ?? product.category_id ?? product.category?.id ?? '') === id).slice(0, 6)
})
const onPlatformBrandUpdated = event => { brand.value = { ...brand.value, ...(event.detail || {}) } }
function submitSearch() {
  const q = searchText.value.trim()
  router.push({ path: '/products', query: q ? { q } : {} })
  categoryOpen.value = false
}
function openCategories() {
  categoryOpen.value = !categoryOpen.value
  accountOpen.value = false
  if (categoryOpen.value && !activeCategory.value) activeCategory.value = topCategories.value[0] || categories.value[0] || null
}
function closeMenus() { categoryOpen.value = false; accountOpen.value = false }
function signOut() { logout(); accountOpen.value = false; router.push('/') }
onMounted(async () => {
  window.addEventListener('platform-brand-updated', onPlatformBrandUpdated)
  try {
    const response = await api.get('/company/brand')
    brand.value = { ...brand.value, ...(response.data?.data || {}) }
    if (/^#[0-9a-f]{6}$/i.test(brand.value.primaryColor || '')) document.documentElement.style.setProperty('--platform-primary', brand.value.primaryColor)
  } catch { /* Keep fallback branding until company profile is configured. */ }
  try {
    const [categoryResponse, productResponse] = await Promise.all([
      api.get('/categories'),
      api.get('/products', { params: { limit: 100, page: 1 } }),
    ])
    const categoryData = categoryResponse.data?.data ?? categoryResponse.data?.categories ?? categoryResponse.data
    const productData = productResponse.data?.data ?? productResponse.data?.products ?? productResponse.data
    categories.value = Array.isArray(categoryData) ? categoryData : (categoryData?.rows || categoryData?.items || categoryData?.categories || [])
    products.value = Array.isArray(productData) ? productData : (productData?.rows || productData?.items || productData?.products || [])
    activeCategory.value = topCategories.value[0] || categories.value[0] || null
  } catch { /* Header navigation remains usable if catalog requests fail. */ }
})
onUnmounted(() => window.removeEventListener('platform-brand-updated', onPlatformBrandUpdated))
</script>

<template>
<div class="min-h-screen bg-[#fbfaf8] text-stone-950" @keydown.esc="closeMenus">
  <div class="bg-stone-950 px-4 py-2 text-center text-[9px] font-bold uppercase tracking-[.2em] text-white sm:text-[10px]">Discover your next favourite · Explore the collection</div>
  <header class="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex min-h-[76px] max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
      <button class="flex h-10 w-8 shrink-0 items-center justify-center text-2xl md:hidden" aria-label="Open navigation" @click="mobile = !mobile">{{ mobile ? '×' : '☰' }}</button>
      <RouterLink to="/" @click="closeMenus" class="flex shrink-0 items-center gap-2.5 text-lg font-black tracking-[-.05em] sm:text-xl">
        <img v-if="brand.logoUrl" :src="brand.logoUrl" :alt="brandName + ' logo'" class="h-8 w-8 object-contain"/>
        <span v-else class="flex h-8 w-8 items-center justify-center rounded-md text-sm text-white" :style="{ backgroundColor: brand.primaryColor || '#171717' }">{{ brandName.slice(0, 1).toUpperCase() }}</span>
        <span>{{ brandName }}</span>
      </RouterLink>
      <form class="hidden min-w-0 max-w-xl flex-1 md:flex" role="search" @submit.prevent="submitSearch">
        <label class="relative block w-full"><span class="sr-only">Search products</span><span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-stone-400">⌕</span><input v-model="searchText" aria-label="Search products" placeholder="Search products, brands and more…" class="!min-h-11 !rounded-full !border-stone-200 !bg-stone-50 !pl-11 !pr-4"/></label>
        <button aria-label="Search" class="-ml-12 z-10 w-12 rounded-full text-lg hover:bg-stone-100">↵</button>
      </form>
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <RouterLink to="/wishlist" aria-label="My wishlist" class="hidden h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-lg hover:border-stone-950 sm:flex">♡</RouterLink>
        <RouterLink to="/cart" aria-label="Cart" class="relative flex h-10 items-center gap-2 rounded-full border border-stone-200 px-3 text-xs font-bold transition hover:border-stone-950"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><span class="hidden sm:inline">Cart</span><span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-950 px-1.5 text-[10px] text-white">{{ cartCount }}</span></RouterLink>
        <div class="relative">
          <button @click="accountOpen = !accountOpen; categoryOpen = false" @mouseenter="accountOpen = true" class="flex h-10 items-center gap-2 rounded-full border border-stone-200 px-3 text-xs font-bold hover:border-stone-950" aria-haspopup="true" :aria-expanded="accountOpen"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.8-3.4 3.2-5.2 7-5.2s6.2 1.8 7 5.2"/></svg><span class="hidden lg:inline">{{ auth.user ? 'My account' : 'Sign in' }}</span><svg class="h-3.5 w-3.5 transition-transform" :class="accountOpen ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg></button>
          <div v-if="accountOpen" @mouseleave="accountOpen = false" class="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl">
            <div class="border-b border-stone-100 px-3 pb-3"><p class="text-sm font-black">{{ auth.user ? (auth.user.name || auth.user.email || 'Welcome back') : 'Welcome to ' + brandName }}</p><p class="mt-1 text-xs text-stone-500">{{ auth.user ? 'Manage your shopping account' : 'Sign in to manage your orders and favourites' }}</p></div>
            <template v-if="auth.user">
              <RouterLink @click="closeMenus" to="/orders" class="mt-2 block rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50">My orders</RouterLink>
              <RouterLink @click="closeMenus" to="/messages" class="block rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50">My messages</RouterLink>
              <RouterLink @click="closeMenus" to="/wishlist" class="block rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50">My wishlist</RouterLink>
              <RouterLink @click="closeMenus" to="/cart" class="block rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50">Cart</RouterLink>
              <RouterLink v-if="canManage" @click="closeMenus" to="/admin" class="block rounded-lg px-3 py-2.5 text-sm hover:bg-stone-50">Management</RouterLink>
              <button @click="signOut" class="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2.5 text-left text-sm font-bold hover:bg-stone-50">Sign out</button>
            </template>
            <template v-else><RouterLink @click="closeMenus" to="/login" class="mt-2 block rounded-lg bg-stone-950 px-3 py-3 text-center text-sm font-bold text-white">Sign in</RouterLink><RouterLink @click="closeMenus" to="/register" class="mt-2 block rounded-lg px-3 py-2 text-center text-sm font-bold hover:bg-stone-50">Create account</RouterLink></template>
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-stone-100">
      <div class="mx-auto flex max-w-[1440px] items-center gap-7 px-4 sm:px-6 lg:px-10">
        <button @click="categoryOpen = !categoryOpen; activeCategory = activeCategory || topCategories[0] || categories[0] || null; accountOpen = false" @mouseenter="categoryOpen = true; accountOpen = false" class="relative flex h-12 shrink-0 items-center gap-2 text-xs font-extrabold uppercase tracking-[.12em]" :class="categoryOpen ? 'text-stone-950' : 'text-stone-600 hover:text-stone-950'" aria-haspopup="true" :aria-expanded="categoryOpen"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg> Categories <svg class="h-3.5 w-3.5 transition-transform" :class="categoryOpen ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 7.5 5 5 5-5"/></svg></button>
        <RouterLink to="/products" @click="closeMenus" class="text-xs font-bold uppercase tracking-[.12em] text-stone-600 hover:text-stone-950">New arrivals</RouterLink>
        <RouterLink to="/products" @click="closeMenus" class="text-xs font-bold uppercase tracking-[.12em] text-stone-600 hover:text-stone-950">All products</RouterLink>
        <RouterLink to="/affiliate" @click="closeMenus" class="hidden text-xs font-bold uppercase tracking-[.12em] text-stone-600 hover:text-stone-950 sm:block">Affiliate</RouterLink>
        <RouterLink v-if="canManage" to="/admin" @click="closeMenus" class="hidden text-xs font-bold uppercase tracking-[.12em] text-stone-600 hover:text-stone-950 lg:block">Management</RouterLink>
      </div>
    </div>
    <div v-if="categoryOpen" @mouseleave="categoryOpen = false" class="absolute left-0 right-0 top-full hidden border-t border-stone-200 bg-white shadow-2xl md:block">
      <div class="mx-auto grid min-h-[350px] max-w-[1440px] grid-cols-[260px_minmax(0,1fr)] px-6 lg:px-10">
        <div class="border-r border-stone-100 py-6 pr-4">
          <p class="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[.2em] text-stone-400">Shop by category</p>
          <div v-for="row in megaCategoryRows" :key="row.item.id" class="flex items-center gap-1 rounded-lg pr-2" :style="{ marginLeft: (row.depth * 10) + 'px' }" :class="String(activeCategory?.id) === String(row.item.id) ? 'bg-stone-100' : 'hover:bg-stone-50'">
            <button v-if="hasChildren(row.item)" @click="toggleCategory(row.item)" :aria-label="(expandedCategoryIds.includes(String(row.item.id)) ? 'Collapse ' : 'Expand ') + row.item.name" :aria-expanded="expandedCategoryIds.includes(String(row.item.id))" class="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-stone-500 hover:bg-stone-200"><svg class="h-3.5 w-3.5 transition-transform" :class="expandedCategoryIds.includes(String(row.item.id)) ? 'rotate-90' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 4 6 6-6 6"/></svg></button>
            <span v-else class="w-8 shrink-0"></span>
            <button @mouseenter="activeCategory = row.item" @focus="activeCategory = row.item" @click="router.push({ path: '/products', query: { categoryId: row.item.id } }); closeMenus()" class="flex min-w-0 flex-1 items-center justify-between py-3 text-left text-sm" :class="String(activeCategory?.id) === String(row.item.id) ? 'font-bold text-stone-950' : 'text-stone-600'"><span class="truncate">{{ row.item.name }}</span><svg class="ml-2 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m7.5 4.5 5 5-5 5"/></svg></button>
          </div>
          <RouterLink to="/categories" @click="closeMenus" class="mt-4 inline-block px-3 text-xs font-bold underline underline-offset-4">View all categories ↗</RouterLink>
        </div>
        <div class="py-6 pl-7">
          <div class="flex items-end justify-between"><div><p class="text-[10px] font-extrabold uppercase tracking-[.2em] text-stone-400">Explore the edit</p><h3 class="mt-2 text-2xl font-black">{{ activeCategory?.name || 'Popular products' }}</h3></div><RouterLink :to="{ path: '/products', query: activeCategory && activeCategory.id !== 'all' ? { categoryId: activeCategory.id } : {} }" @click="closeMenus" class="text-xs font-bold underline underline-offset-4">Shop this collection ↗</RouterLink></div>
          <div v-if="categoryProducts.length" class="mt-5 grid grid-cols-3 gap-4 xl:grid-cols-5">
            <RouterLink v-for="product in categoryProducts" :key="product.id" :to="'/products/' + product.slug" @click="closeMenus" class="group min-w-0"><div class="aspect-[4/5] overflow-hidden rounded-lg bg-stone-100"><img v-if="product.imageUrl || product.image" :src="product.imageUrl || product.image" :alt="product.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div v-else class="flex h-full items-center justify-center text-2xl text-stone-300">✳</div></div><p class="mt-2 line-clamp-2 text-xs font-semibold">{{ product.name }}</p><p class="mt-1 text-xs font-black">{{ Number(product.price || 0).toLocaleString() }} {{ product.currency || 'ETB' }}</p></RouterLink>
          </div>
          <div v-else class="mt-6 rounded-xl bg-stone-50 p-8 text-sm text-stone-500">No products in this collection yet. <RouterLink to="/products" @click="closeMenus" class="font-bold underline">Browse all products</RouterLink></div>
        </div>
      </div>
    </div>
    <div v-if="mobile" class="border-t border-stone-200 bg-white px-4 py-4 md:hidden">
      <form class="mb-3 flex gap-2" role="search" @submit.prevent="submitSearch"><input v-model="searchText" aria-label="Search products" placeholder="Search products…" class="!min-h-11 !rounded-full !bg-stone-50"/><button class="rounded-full bg-stone-950 px-4 text-xs font-bold text-white">Search</button></form>
      <button @click="categoryOpen = !categoryOpen" class="flex w-full justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold">Categories <svg class="h-4 w-4 transition-transform" :class="categoryOpen ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 7.5 5 5 5-5"/></svg></button>
      <div v-if="categoryOpen" class="grid gap-1 rounded-lg bg-stone-50 p-2"><RouterLink v-for="item in categories" :key="item.id" @click="closeMenus" :to="{ path: '/products', query: { categoryId: item.id } }" class="rounded-md px-3 py-2 text-sm">{{ item.name }}</RouterLink><RouterLink @click="closeMenus" to="/categories" class="px-3 py-2 text-sm font-bold">View all categories</RouterLink></div>
      <RouterLink @click="mobile = false" to="/products" class="block rounded-lg px-3 py-3 text-sm font-semibold">All products</RouterLink>
      <RouterLink @click="mobile = false" to="/orders" class="block rounded-lg px-3 py-3 text-sm font-semibold">My orders</RouterLink>
      <RouterLink @click="mobile = false" to="/messages" class="block rounded-lg px-3 py-3 text-sm font-semibold">My messages</RouterLink>
      <RouterLink @click="mobile = false" to="/wishlist" class="block rounded-lg px-3 py-3 text-sm font-semibold">My wishlist</RouterLink>
      <RouterLink @click="mobile = false" to="/cart" class="block rounded-lg px-3 py-3 text-sm font-semibold">Cart ({{ cartCount }})</RouterLink>
      <RouterLink v-if="!auth.user" @click="mobile = false" to="/login" class="block rounded-lg px-3 py-3 text-sm font-semibold">Sign in</RouterLink>
      <RouterLink v-if="!auth.user" @click="mobile = false" to="/register" class="block rounded-lg px-3 py-3 text-sm font-semibold">Create account</RouterLink>
      <button v-else @click="signOut; mobile = false" class="block rounded-lg px-3 py-3 text-sm font-semibold">Sign out</button>
    </div>
  </header>
  <main class="mx-auto min-h-[65vh] max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10"><slot/></main>
  <footer class="mt-16 border-t border-stone-200 bg-white">
    <div class="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
      <div class="sm:col-span-2"><p class="text-lg font-black tracking-tight">{{ brandName }}</p><p class="mt-3 max-w-sm text-sm leading-6 text-stone-500">{{ brand.tagline || 'Good finds for everyday life. Explore the collection and discover something you love.' }}</p></div>
      <div><p class="text-[10px] font-extrabold uppercase tracking-[.18em]">Explore</p><div class="mt-4 grid gap-3 text-sm text-stone-500"><RouterLink to="/categories">Categories</RouterLink><RouterLink to="/products">All products</RouterLink></div></div>
      <div><p class="text-[10px] font-extrabold uppercase tracking-[.18em]">Your account</p><div class="mt-4 grid gap-3 text-sm text-stone-500"><RouterLink to="/orders">My orders</RouterLink><RouterLink to="/messages">My messages</RouterLink><RouterLink to="/wishlist">My wishlist</RouterLink><RouterLink to="/cart">Cart</RouterLink><RouterLink to="/affiliate">Affiliate program</RouterLink></div></div>
    </div>
    <div class="border-t border-stone-100 py-4 text-center text-[10px] text-stone-400">© {{ new Date().getFullYear() }} {{ brandName }}. All rights reserved.</div>
  </footer>
</div>
</template>