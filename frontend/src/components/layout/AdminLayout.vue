<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { auth, logout } from '../../stores'
import api from '../../services/api'

const route = useRoute()
const router = useRouter()
const platformBrand = ref({ platformName: '', name: '', logoUrl: '', tagline: '', primaryColor: '#4f46e5' })
const brandTitle = computed(() => platformBrand.value.platformName || platformBrand.value.name || 'MarketFlow')
async function loadPlatformBrand() {
  try {
    const response = await api.get('/company/brand')
    platformBrand.value = { ...platformBrand.value, ...(response.data?.data || {}) }
  } catch { /* Use fallback branding until company settings are available. */ }
}
function onPlatformBrandUpdated(event) { platformBrand.value = { ...platformBrand.value, ...(event.detail || {}) } }
onMounted(() => { loadPlatformBrand(); window.addEventListener('platform-brand-updated', onPlatformBrandUpdated) })
onUnmounted(() => window.removeEventListener('platform-brand-updated', onPlatformBrandUpdated))
watch(() => platformBrand.value.primaryColor, color => {
  if (typeof document !== 'undefined' && /^#[0-9a-f]{6}$/i.test(color || '')) document.documentElement.style.setProperty('--platform-primary', color)
}, { immediate: true })

const mobileOpen = ref(false)
const profileOpen = ref(false)
const notificationsOpen = ref(false)
const openGroups = ref([])
const groups = [
  { label: 'Workspace', items: [{ label: 'Overview', path: '/admin', icon: '▦', permission: 'dashboard.view' }, { label: 'Users & access', path: '/admin/users', icon: '♙', permission: 'users.view' }] },
  { label: 'Catalog', items: [
    { label: 'Products', path: '/admin/products', icon: '▣', permission: 'catalog.view' },
    { label: 'Categories', path: '/admin/categories', icon: '▤', permission: 'catalog.view' },
    { label: 'Brands', path: '/admin/brands', icon: '◈', permission: 'catalog.view' },
    { label: 'Variants', path: '/admin/variants', icon: '◇', permission: 'catalog.view' },
    { label: 'Attributes & values', path: '/admin/attributes', icon: '☷', permission: 'catalog.view' },
    { label: 'Category attributes', path: '/admin/category-attributes', icon: '⚙', permission: 'catalog.view' },
  ] },
  { label: 'Inventory', items: [
    { label: 'Stock levels', path: '/admin/inventory', icon: '▥', permission: 'inventory.view' },
    { label: 'Stock movements', path: '/admin/inventory-movements', icon: '↕', permission: 'inventory.view' },
    { label: 'Warehouses', path: '/admin/warehouses', icon: '⌂', permission: 'inventory.view' },
  ] },
  { label: 'Procurement', items: [
    { label: 'Suppliers', path: '/admin/suppliers', icon: '♧', permission: 'procurement.view' },
    { label: 'Supplier catalog', path: '/admin/supplier-products', icon: '▧', permission: 'procurement.view' },
    { label: 'Purchase orders', path: '/admin/purchase-orders', icon: '▤', permission: 'procurement.view' },
  ] },
  { label: 'Sales', items: [
    { label: 'Orders', path: '/admin/orders', icon: '▱', permission: 'orders.view' },
    { label: 'Customer carts', path: '/admin/carts', icon: '▢', permission: 'orders.view' },
    { label: 'Payments', path: '/admin/payments', icon: '◉', permission: 'payments.view' },
  ] },
  { label: 'Growth', items: [
    { label: 'Affiliate programs', path: '/admin/affiliate-programs', icon: '↗', permission: 'affiliates.manage' },
    { label: 'Affiliate links', path: '/admin/affiliate-links', icon: '⌁', permission: 'affiliates.manage' },
    { label: 'Commissions', path: '/admin/commissions', icon: '$', permission: 'finance.view' },
    { label: 'Payouts', path: '/admin/payouts', icon: '⇄', permission: 'finance.manage' },
  ] },
  { label: 'Settings', items: [{ label: 'Company profile', path: '/admin/company', icon: '⚙', permission: 'company.manage' }, { label: 'Roles & permissions', path: '/admin/access-control', icon: '♙', permission: 'access.manage' }] },
]
const visibleGroups = computed(() => {
  const isAdmin = String(auth.user?.role || '').toLowerCase() === 'admin' || (auth.user?.roles || []).some(role => (typeof role === 'string' ? role : role.slug) === 'admin')
  const permissions = auth.user?.permissions || []
  const legacyStaff = String(auth.user?.role || '').toLowerCase() === 'company_staff'
  return groups.map(group => ({
    ...group,
    items: group.items.filter(item => item.path === '/admin/users' ? (isAdmin || legacyStaff || permissions.includes('users.view') || permissions.includes('users.manage')) : (!item.permission || isAdmin || legacyStaff || permissions.includes(item.permission))),
  })).filter(group => group.items.length)
})
const initials = computed(() => (auth.user?.name || auth.user?.email || 'Admin').trim().slice(0, 1).toUpperCase())
function isActive(path) {
  return path === '/admin' ? route.path === path : route.path === path || route.path.startsWith(path + '/')
}
function groupIsActive(group) { return group.items.some(item => isActive(item.path)) }
function toggleGroup(label) {
  openGroups.value = openGroups.value.includes(label) ? openGroups.value.filter(item => item !== label) : [...openGroups.value, label]
}
function signOut() {
  logout()
  profileOpen.value = false
  router.push('/login')
}
watch(() => route.fullPath, () => {
  mobileOpen.value = false
  profileOpen.value = false
  notificationsOpen.value = false
})
</script>

<template>
  <div class="min-h-screen bg-[#f6f8fb] text-slate-900">
    <button v-if="mobileOpen" type="button" class="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" aria-label="Close navigation overlay" @click="mobileOpen = false"></button>
    <aside :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'" class="fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-[#dce3ed] bg-[#eaf0f8] text-slate-700 transition-transform duration-200">
      <div class="flex h-[66px] shrink-0 items-center gap-3 border-b border-slate-200 px-5">
        <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md text-sm font-extrabold text-white" :style="{ backgroundColor: platformBrand.primaryColor || '#4f46e5' }">
          <img v-if="platformBrand.logoUrl" :src="platformBrand.logoUrl" :alt="brandTitle + ' logo'" class="h-full w-full bg-white object-contain" />
          <span v-else>{{ brandTitle.slice(0, 1).toUpperCase() }}</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[15px] font-bold tracking-tight text-slate-900">{{ brandTitle }}</p>
          <p class="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{{ platformBrand.tagline || 'Commerce' }}</p>
        </div>
        <button type="button" class="rounded px-2 py-1 text-slate-500 hover:bg-white lg:hidden" aria-label="Close menu" @click="mobileOpen = false">×</button>
      </div>
      <nav class="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p class="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Workspace</p>
        <template v-for="group in visibleGroups" :key="group.label">
          <div v-if="group.label === 'Workspace'" class="mb-1">
            <RouterLink v-for="item in group.items" :key="item.path" :to="item.path" class="mb-1 flex min-h-9 items-center gap-3 rounded-md px-3 text-[12px] font-semibold transition-colors" :class="isActive(item.path) ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'">
              <span class="w-4 text-center text-[14px]">{{ item.icon }}</span>{{ item.label }}
            </RouterLink>
          </div>
          <div v-else class="mt-1">
            <button type="button" class="flex min-h-9 w-full items-center gap-2 rounded-md px-3 text-left text-[12px] font-bold tracking-[.01em] transition-colors" :class="groupIsActive(group) ? 'text-indigo-900' : 'text-slate-700 hover:bg-white/80 hover:text-slate-950'" :aria-expanded="openGroups.includes(group.label)" @click="toggleGroup(group.label)">
              <span class="flex-1">{{ group.label }}</span>
              <span class="text-[12px] transition-transform" :class="openGroups.includes(group.label) ? 'rotate-90' : ''">›</span>
            </button>
            <div v-if="openGroups.includes(group.label)" class="ml-2 border-l border-slate-300/80 pl-2">
              <RouterLink v-for="item in group.items" :key="item.path" :to="item.path" :aria-current="isActive(item.path) ? 'page' : undefined" class="mb-0.5 flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-[12px] font-medium transition-colors" :class="isActive(item.path) ? 'bg-white font-semibold text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'">
                <span class="w-4 text-center text-[13px]">{{ item.icon }}</span><span class="flex-1">{{ item.label }}</span>
                <span v-if="isActive(item.path)" class="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
              </RouterLink>
            </div>
          </div>
        </template>
      </nav>
      <div class="border-t border-slate-200 px-3 py-3">
        <RouterLink to="/shop" class="flex min-h-9 items-center gap-3 rounded-md px-3 text-[12px] font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900"><span>↗</span> Customer storefront</RouterLink>
        <RouterLink to="/affiliate" class="flex min-h-9 items-center gap-3 rounded-md px-3 text-[12px] font-semibold text-slate-600 hover:bg-white/70 hover:text-slate-900"><span>◎</span> Affiliate portal</RouterLink>
      </div>
    </aside>
    <div class="min-h-screen lg:pl-[250px]">
      <header class="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
        <div class="flex min-w-0 items-center gap-3">
          <button type="button" class="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 lg:hidden" aria-label="Open navigation" @click="mobileOpen = true">☰</button>
        </div>
        <div class="ml-3 flex shrink-0 items-center gap-2">
          <div class="relative">
            <button type="button" class="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label="Notifications" :aria-expanded="notificationsOpen" @click="notificationsOpen = !notificationsOpen; profileOpen = false">♧</button>
            <div v-if="notificationsOpen" class="absolute right-0 top-11 z-50 w-64 border border-slate-200 bg-white p-4 shadow-lg">
              <p class="text-[13px] font-semibold text-slate-900">Notifications</p>
              <p class="mt-2 text-[12px] text-slate-500">No new notifications.</p>
            </div>
          </div>
          <div class="relative">
            <button type="button" class="flex items-center gap-2 rounded-md p-1.5 transition hover:bg-slate-100" :aria-expanded="profileOpen" @click="profileOpen = !profileOpen; notificationsOpen = false">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[12px] font-bold text-indigo-700">{{ initials }}</span>
              <span class="hidden max-w-[130px] truncate text-[12px] font-semibold text-slate-700 sm:block">{{ auth.user?.name || auth.user?.email || 'Account' }}</span>
              <span class="text-[10px] text-slate-400">▾</span>
            </button>
            <div v-if="profileOpen" class="absolute right-0 top-11 z-50 w-60 border border-slate-200 bg-white p-2 shadow-lg">
              <div class="border-b border-slate-100 px-3 py-2">
                <p class="truncate text-[12px] font-semibold text-slate-900">{{ auth.user?.name || 'My profile' }}</p>
                <p class="truncate text-[11px] text-slate-500">{{ auth.user?.email || '' }}</p>
                <p class="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{{ String(auth.user?.role || 'user').replaceAll('_', ' ') }}</p>
              </div>
              <button type="button" class="mt-1 flex w-full items-center rounded px-3 py-2 text-left text-[12px] text-slate-600 hover:bg-slate-50" @click="profileOpen = false">My profile <span class="ml-auto text-[10px] text-slate-400">Account details above</span></button>
              <div class="my-1 border-t border-slate-100"></div>
              <button type="button" class="flex w-full items-center rounded px-3 py-2 text-left text-[12px] font-semibold text-rose-600 hover:bg-rose-50" @click="signOut">↪ <span class="ml-2">Log out</span></button>
            </div>
          </div>
        </div>
      </header>
      <main class="mx-auto min-h-[calc(100vh-110px)] max-w-[1500px] px-4 py-5 sm:px-7 sm:py-6 lg:px-8"><slot /></main>
      <footer class="border-t border-slate-200/80 bg-white px-4 py-3 text-[10px] text-slate-400 sm:px-7 lg:px-8">{{ brandTitle }} · {{ platformBrand.tagline || 'Commerce operations' }}</footer>
    </div>
  </div>
</template>
