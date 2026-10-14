<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { auth, cartCount, logout } from '../../stores'
import api from '../../services/api'
const mobile = ref(false)
const route = useRoute()
const brand = ref({ platformName: '', name: '', tagline: '', logoUrl: '', primaryColor: '#171717' })
const brandName = computed(() => brand.value.platformName || brand.value.name || 'MarketFlow')
const roleSlugs = computed(() => (auth.user?.roles || []).map(role => typeof role === 'string' ? role : role.slug))
const canManage = computed(() => ['admin', 'company_staff'].includes(String(auth.user?.role || '').toLowerCase()) || roleSlugs.value.some(role => !['customer', 'affiliate'].includes(role)) || (auth.user?.permissions || []).some(permission => permission.endsWith('.manage') || permission === 'dashboard.view'))
const onPlatformBrandUpdated = event => { brand.value = { ...brand.value, ...(event.detail || {}) } }
const navClass = path => route.path === path ? 'text-stone-950 after:absolute after:-bottom-[22px] after:left-0 after:right-0 after:h-0.5 after:bg-stone-950' : 'text-stone-500 hover:text-stone-950'
onMounted(async () => {
  window.addEventListener('platform-brand-updated', onPlatformBrandUpdated)
  try {
    const response = await api.get('/company/brand')
    brand.value = { ...brand.value, ...(response.data?.data || {}) }
    if (/^#[0-9a-f]{6}$/i.test(brand.value.primaryColor || '')) document.documentElement.style.setProperty('--platform-primary', brand.value.primaryColor)
  } catch { /* Keep fallback branding until company profile is configured. */ }
})
onUnmounted(() => window.removeEventListener('platform-brand-updated', onPlatformBrandUpdated))
</script>

<template>
<div class="min-h-screen bg-[#fbfaf8] text-stone-950">
  <div class="bg-stone-950 px-4 py-2 text-center text-[9px] font-bold uppercase tracking-[.2em] text-white sm:text-[10px]">Discover your next favourite · Explore the collection</div>
  <header class="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
      <button class="flex h-10 w-9 items-center justify-center text-2xl md:hidden" aria-label="Open navigation" @click="mobile = !mobile">{{ mobile ? '×' : '☰' }}</button>
      <RouterLink to="/" class="flex shrink-0 items-center gap-2.5 text-lg font-black tracking-[-.05em] sm:text-xl">
        <img v-if="brand.logoUrl" :src="brand.logoUrl" :alt="brandName + ' logo'" class="h-8 w-8 object-contain"/>
        <span v-else class="flex h-8 w-8 items-center justify-center rounded-md text-sm text-white" :style="{ backgroundColor: brand.primaryColor || '#171717' }">{{ brandName.slice(0, 1).toUpperCase() }}</span>
        <span>{{ brandName }}</span>
      </RouterLink>
      <nav class="hidden items-center gap-7 md:flex">
        <RouterLink to="/" :class="navClass('/')" class="relative text-xs font-bold uppercase tracking-[.12em] transition">Home</RouterLink>
        <RouterLink to="/categories" :class="navClass('/categories')" class="relative text-xs font-bold uppercase tracking-[.12em] transition">Categories</RouterLink>
        <RouterLink to="/products" :class="navClass('/products')" class="relative text-xs font-bold uppercase tracking-[.12em] transition">Products</RouterLink>
        <RouterLink to="/affiliate" class="text-xs font-bold uppercase tracking-[.12em] text-stone-500 transition hover:text-stone-950">Affiliate</RouterLink>
        <RouterLink v-if="canManage" to="/admin" class="text-xs font-bold uppercase tracking-[.12em] text-stone-500 transition hover:text-stone-950">Management</RouterLink>
      </nav>
      <div class="flex shrink-0 items-center gap-2">
        <RouterLink to="/cart" aria-label="Shopping cart" class="relative flex h-10 items-center gap-2 rounded-full border border-stone-200 px-3 text-xs font-bold transition hover:border-stone-950"><span class="text-lg">♧</span><span class="hidden sm:inline">Bag</span><span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-950 px-1.5 text-[10px] text-white">{{ cartCount }}</span></RouterLink>
        <RouterLink v-if="!auth.user" to="/login" class="hidden rounded-full bg-stone-950 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-stone-700 sm:block">Sign in</RouterLink>
        <button v-else @click="logout" class="hidden rounded-full border border-stone-200 px-4 py-3 text-[10px] font-bold uppercase tracking-wider sm:block">Sign out</button>
      </div>
    </div>
    <nav v-if="mobile" class="grid gap-1 border-t border-stone-200 bg-white px-4 py-3 md:hidden">
      <RouterLink @click="mobile = false" to="/" class="rounded-lg px-3 py-3 text-sm font-semibold">Home</RouterLink>
      <RouterLink @click="mobile = false" to="/categories" class="rounded-lg px-3 py-3 text-sm font-semibold">Categories</RouterLink>
      <RouterLink @click="mobile = false" to="/products" class="rounded-lg px-3 py-3 text-sm font-semibold">All products</RouterLink>
      <RouterLink @click="mobile = false" to="/affiliate" class="rounded-lg px-3 py-3 text-sm font-semibold">Affiliate program</RouterLink>
      <RouterLink v-if="canManage" @click="mobile = false" to="/admin" class="rounded-lg px-3 py-3 text-sm font-semibold">Management</RouterLink>
      <RouterLink v-if="!auth.user" @click="mobile = false" to="/login" class="rounded-lg px-3 py-3 text-sm font-semibold">Sign in / Register</RouterLink>
    </nav>
  </header>
  <main class="mx-auto min-h-[65vh] max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10"><slot/></main>
  <footer class="mt-16 border-t border-stone-200 bg-white">
    <div class="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
      <div class="sm:col-span-2"><p class="text-lg font-black tracking-tight">{{ brandName }}</p><p class="mt-3 max-w-sm text-sm leading-6 text-stone-500">{{ brand.tagline || 'Good finds for everyday life. Explore the collection and discover something you love.' }}</p></div>
      <div><p class="text-[10px] font-extrabold uppercase tracking-[.18em]">Explore</p><div class="mt-4 grid gap-3 text-sm text-stone-500"><RouterLink to="/">Home</RouterLink><RouterLink to="/categories">Categories</RouterLink><RouterLink to="/products">All products</RouterLink></div></div>
      <div><p class="text-[10px] font-extrabold uppercase tracking-[.18em]">Your account</p><div class="mt-4 grid gap-3 text-sm text-stone-500"><RouterLink to="/cart">Shopping bag</RouterLink><RouterLink to="/orders">Orders</RouterLink><RouterLink to="/affiliate">Affiliate program</RouterLink></div></div>
    </div>
    <div class="border-t border-stone-100 py-4 text-center text-[10px] text-stone-400">© {{ new Date().getFullYear() }} {{ brandName }}. All rights reserved.</div>
  </footer>
</div>
</template>
