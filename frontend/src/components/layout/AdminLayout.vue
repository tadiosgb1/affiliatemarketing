<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { auth, logout } from '../../stores'

const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)
const groups = [
  { label: 'Workspace', items: [{ label: 'Overview', path: '/admin', icon: 'OV' }] },
  { label: 'Catalog', items: [
    { label: 'Products', path: '/admin/products', icon: 'PR' },
    { label: 'Categories', path: '/admin/categories', icon: 'CA' },
    { label: 'Brands', path: '/admin/brands', icon: 'BR' },
    { label: 'Attributes', path: '/admin/attributes', icon: 'AT' },
  ] },
  { label: 'Operations', items: [
    { label: 'Inventory & stock', path: '/admin/inventory', icon: 'IN' },
    { label: 'Warehouses', path: '/admin/warehouses', icon: 'WH' },
    { label: 'Suppliers', path: '/admin/suppliers', icon: 'SU' },
    { label: 'Purchase orders', path: '/admin/purchase-orders', icon: 'PO' },
    { label: 'Orders', path: '/admin/orders', icon: 'OR' },
    { label: 'Payments', path: '/admin/payments', icon: 'PA' },
  ] },
  { label: 'Growth', items: [{ label: 'Affiliate programs', path: '/admin/affiliate-programs', icon: 'AF' }] },
]
const pageTitle = computed(() => groups.flatMap(group => group.items).find(item => item.path === route.path)?.label || 'Administration')
const initials = computed(() => (auth.user?.name || auth.user?.email || 'Admin').trim().slice(0, 1).toUpperCase())
function isActive(path) {
  return path === '/admin' ? route.path === path : route.path === path || route.path.startsWith(path + '/')
}
function signOut() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#f6f8fc] text-slate-900">
    <button v-if="mobileOpen" type="button" class="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden" aria-label="Close navigation overlay" @click="mobileOpen = false"></button>
    <aside :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'" class="fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-slate-800 bg-[#111827] text-slate-200 transition-transform duration-200">
      <div class="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[.08] px-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-[11px] bg-indigo-500 text-sm font-extrabold text-white shadow-lg shadow-indigo-950/30">M</div>
        <div class="min-w-0 flex-1"><p class="text-[15px] font-bold tracking-[-.03em] text-white">MarketFlow</p><p class="mt-0.5 text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">Commerce platform</p></div>
        <button type="button" class="rounded-md px-2 py-1 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu" @click="mobileOpen = false">×</button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-5">
        <p class="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Management</p>
        <nav v-for="group in groups" :key="group.label" class="mt-4">
          <p v-if="group.label !== 'Workspace'" class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">{{ group.label }}</p>
          <RouterLink v-for="item in group.items" :key="item.path" :to="item.path" @click="mobileOpen = false" :aria-current="isActive(item.path) ? 'page' : undefined" :class="isActive(item.path) ? 'bg-indigo-500/15 text-white before:bg-indigo-400' : 'text-slate-400 before:bg-transparent hover:bg-white/[.045] hover:text-slate-100'" class="relative mb-1 flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full">
            <span :class="isActive(item.path) ? 'border-indigo-400/30 bg-indigo-400/15 text-indigo-200' : 'border-white/[.08] bg-white/[.035] text-slate-400'" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[9px] font-bold tracking-wide">{{ item.icon }}</span>
            <span class="flex-1">{{ item.label }}</span><span v-if="isActive(item.path)" class="h-1.5 w-1.5 rounded-full bg-indigo-300"></span>
          </RouterLink>
        </nav>
      </div>
      <div class="mt-auto px-3 pb-3">
        <div class="mb-3 rounded-xl border border-white/[.07] bg-white/[.035] p-3">
          <p class="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">Storefront</p>
          <RouterLink to="/shop" class="mt-2 flex items-center gap-2 rounded-md py-1 text-[12px] font-medium text-slate-300 transition hover:text-white" @click="mobileOpen = false"><span class="flex h-6 w-6 items-center justify-center rounded-md bg-white/[.07] text-xs">↗</span>Open customer store</RouterLink>
          <RouterLink to="/affiliate" class="mt-1 flex items-center gap-2 rounded-md py-1 text-[12px] font-medium text-slate-300 transition hover:text-white" @click="mobileOpen = false"><span class="flex h-6 w-6 items-center justify-center rounded-md bg-white/[.07] text-xs">◎</span>Affiliate portal</RouterLink>
        </div>
        <div class="flex items-center gap-2.5 border-t border-white/[.08] px-1 pb-2 pt-4">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-300/20 bg-indigo-400/15 text-sm font-bold text-indigo-200">{{ initials }}</div>
          <div class="min-w-0 flex-1"><p class="truncate text-[12px] font-semibold text-white">{{ auth.user?.name || 'Administrator' }}</p><p class="truncate text-[11px] text-slate-500">{{ auth.user?.email || 'Admin account' }}</p></div>
          <button type="button" @click="signOut" title="Sign out" aria-label="Sign out" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300">↪</button>
        </div>
      </div>
    </aside>
    <div class="min-h-screen lg:pl-[258px]">
      <header class="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-7">
        <div class="flex min-w-0 items-center gap-3">
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden" aria-label="Open navigation" @click="mobileOpen = true">☰</button>
          <div class="min-w-0"><p class="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">MarketFlow <span class="px-1 text-slate-300">/</span> Admin workspace</p><h1 class="mt-0.5 truncate text-[17px] font-bold tracking-[-.025em] text-slate-900">{{ pageTitle }}</h1></div>
        </div>
        <div class="ml-3 flex shrink-0 items-center gap-3">
          <div class="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 sm:flex"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span><span class="text-[11px] font-semibold text-emerald-700">Admin workspace</span></div>
          <div class="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-700">{{ initials }}</div>
        </div>
      </header>
      <main class="mx-auto min-h-[calc(100vh-128px)] max-w-[1500px] px-4 py-6 sm:px-7 sm:py-7 lg:px-8"><slot /></main>
      <footer class="border-t border-slate-200/70 px-4 py-4 text-[11px] text-slate-400 sm:px-7 lg:px-8">MarketFlow · Commerce administration</footer>
    </div>
  </div>
</template>
