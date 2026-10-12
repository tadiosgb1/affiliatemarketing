<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { auth, logout } from '../../stores'

const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)
const navigation = [
  { label: 'Overview', path: '/admin', icon: '◫' },
  { label: 'Products', path: '/admin/products', icon: '▦' },
  { label: 'Categories', path: '/admin/categories', icon: '▤' },
  { label: 'Inventory & stock', path: '/admin/inventory', icon: '▣' },
  { label: 'Payments', path: '/admin/payments', icon: '↗' },
]
const pageTitle = computed(() => navigation.find(item => item.path === route.path)?.label || 'Administration')
const initials = computed(() => (auth.user?.name || auth.user?.email || 'Admin').slice(0, 1).toUpperCase())
function signOut() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" @click="mobileOpen = false"></div>
    <aside :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'" class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-200 transition-transform duration-200">
      <div class="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-lg font-black text-white">M</div>
        <div><p class="text-lg font-black tracking-tight text-white">MarketFlow</p><p class="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">Commerce admin</p></div>
        <button class="ml-auto rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu" @click="mobileOpen = false">✕</button>
      </div>
      <div class="px-4 pt-7"><p class="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Workspace</p>
        <nav class="mt-3 space-y-1">
          <RouterLink v-for="item in navigation" :key="item.path" :to="item.path" @click="mobileOpen = false" :class="route.path === item.path ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'" class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base">{{ item.icon }}</span>{{ item.label }}
          </RouterLink>
        </nav>
      </div>
      <div class="mt-7 px-4"><p class="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Store</p>
        <RouterLink to="/shop" class="mt-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"><span class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">⌂</span>View storefront <span class="ml-auto">↗</span></RouterLink>
        <RouterLink to="/affiliate" class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"><span class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">◎</span>Affiliate program</RouterLink>
      </div>
      <div class="mt-auto border-t border-white/10 p-4">
        <div class="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 font-black text-white">{{ initials }}</div><div class="min-w-0 flex-1"><p class="truncate text-sm font-bold text-white">{{ auth.user?.name || 'Administrator' }}</p><p class="truncate text-xs text-slate-400">{{ auth.user?.email }}</p></div></div>
        <button @click="signOut" class="mt-3 w-full rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white">↪ Sign out</button>
      </div>
    </aside>

    <div class="min-h-screen lg:pl-72">
      <header class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
        <div class="flex items-center gap-3"><button class="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden" aria-label="Open navigation" @click="mobileOpen = true">☰</button><div><p class="text-xs font-semibold text-slate-400">MarketFlow / Admin</p><h1 class="text-lg font-black tracking-tight">{{ pageTitle }}</h1></div></div>
        <div class="flex items-center gap-3"><span class="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">● System workspace</span><div class="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 font-black text-indigo-700">{{ initials }}</div></div>
      </header>
      <main class="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-9"><slot /></main>
      <footer class="px-7 pb-7 text-xs text-slate-400">MarketFlow administration · Manage your commerce operations</footer>
    </div>
  </div>
</template>
