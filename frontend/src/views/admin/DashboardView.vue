<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../services/api'

const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const serviceErrors = ref([])
const products = ref([])
const categories = ref([])
const orders = ref([])
const payments = ref([])
const inventory = ref([])
const lastUpdated = ref(null)

function rows(response, fallback = []) {
  const value = response?.data?.data ?? response?.data?.products ?? response?.data?.categories ?? response?.data?.orders ?? response?.data?.payments
  return Array.isArray(value) ? value : fallback
}
const paidOrders = computed(() => orders.value.filter(order => ['paid', 'completed', 'delivered'].includes(String(order.paymentStatus || order.status || '').toLowerCase())))
const revenue = computed(() => paidOrders.value.reduce((sum, order) => sum + Number(order.total || order.subtotal || 0), 0))
const pendingPayments = computed(() => payments.value.filter(payment => ['pending', 'verification_pending'].includes(String(payment.status || '').toLowerCase())).length)
const lowStock = computed(() => inventory.value.filter(row => Number(row.quantityOnHand || 0) <= Number(row.reorderLevel || 0)).length)
const activeProducts = computed(() => products.value.filter(product => String(product.status || '').toLowerCase() === 'active').length)
const topCategories = computed(() => categories.value.filter(category => !category.parentId).length)
const subcategories = computed(() => categories.value.filter(category => Boolean(category.parentId)).length)
const monthlySales = computed(() => {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')
    const amount = paidOrders.value.filter(order => {
      const created = new Date(order.createdAt)
      return !Number.isNaN(created.getTime()) && created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth()
    }).reduce((sum, order) => sum + Number(order.total || order.subtotal || 0), 0)
    return { key, label: date.toLocaleDateString(undefined, { month: 'short' }), amount }
  })
})
const chartMax = computed(() => Math.max(1, ...monthlySales.value.map(item => item.amount)))
const recentOrders = computed(() => [...orders.value].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6))
const paymentStatuses = computed(() => {
  const statuses = ['paid', 'verification_pending', 'pending', 'rejected', 'failed']
  return statuses.map(status => ({ status, count: payments.value.filter(payment => String(payment.status || '').toLowerCase() === status).length }))
})
const totalPayments = computed(() => payments.value.length)
const formatMoney = value => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(Number(value) || 0)
const formatDate = value => {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'
}
const labelStatus = value => String(value || 'pending').replaceAll('_', ' ')

async function loadDashboard(isRefresh = false) {
  if (isRefresh) refreshing.value = true
  else loading.value = true
  error.value = ''
  serviceErrors.value = []
  try {
    const services = [
      { label: 'Products', request: api.get('/products/admin/all'), assign: value => { products.value = rows(value) } },
      { label: 'Categories', request: api.get('/categories'), assign: value => { categories.value = rows(value) } },
      { label: 'Orders', request: api.get('/orders/admin/all'), assign: value => { orders.value = rows(value) } },
      { label: 'Payments', request: api.get('/payments/admin/all'), assign: value => { payments.value = rows(value) } },
      { label: 'Inventory', request: api.get('/inventory'), assign: value => { inventory.value = rows(value) } },
    ]
    const results = await Promise.allSettled(services.map(service => service.request))
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') services[index].assign(result.value)
      else {
        const status = result.reason?.response?.status
        const message = result.reason?.response?.data?.message || result.reason?.message || 'Request failed'
        serviceErrors.value.push(services[index].label + ': ' + (status ? status + ' — ' : '') + message)
      }
    })
    if (serviceErrors.value.length === services.length) {
      error.value = 'The dashboard could not reach any data service. Check that the backend is running, your session is valid, and the database is connected.'
    }
    lastUpdated.value = new Date()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Dashboard data could not be loaded.'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => loadDashboard())
</script>

<template>
  <section class="space-y-5 text-sm">
    <header class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[.16em] text-indigo-600">Store performance</p>
        <h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">Dashboard overview</h2>
        <p class="mt-1 text-sm text-slate-500">Live operational metrics from your catalog, orders, payments and inventory.</p>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="lastUpdated" class="text-xs text-slate-400">Updated {{ lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
        <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50" :disabled="refreshing" @click="loadDashboard(true)">{{ refreshing ? 'Refreshing…' : '↻ Refresh data' }}</button>
      </div>
    </header>

    <div v-if="error" role="alert" class="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span>{{ error }}</span><button class="font-semibold underline" @click="loadDashboard(true)">Retry</button>
    </div>
    <div v-if="serviceErrors.length && !error" class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
      <p class="font-semibold">Some services could not be loaded. The other metrics remain available.</p>
      <ul class="mt-1 list-inside list-disc space-y-0.5"><li v-for="item in serviceErrors" :key="item">{{ item }}</li></ul>
      <button class="mt-2 font-semibold underline" @click="loadDashboard(true)">Retry failed services</button>
    </div>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="n in 4" :key="n" class="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"></div>
    </div>
    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between"><span class="text-xs font-semibold text-slate-500">Gross paid revenue</span><span class="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">ETB</span></div>
        <p class="mt-3 text-2xl font-bold tracking-tight text-slate-900">{{ formatMoney(revenue) }}</p><p class="mt-1 text-xs text-slate-500">From paid/completed orders</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between"><span class="text-xs font-semibold text-slate-500">Orders</span><span class="rounded-lg bg-blue-50 px-2 py-1 text-blue-700">↗</span></div>
        <p class="mt-3 text-2xl font-bold tracking-tight text-slate-900">{{ orders.length }}</p><p class="mt-1 text-xs text-slate-500">{{ paidOrders.length }} paid or completed</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between"><span class="text-xs font-semibold text-slate-500">Active products</span><span class="rounded-lg bg-violet-50 px-2 py-1 text-violet-700">▦</span></div>
        <p class="mt-3 text-2xl font-bold tracking-tight text-slate-900">{{ activeProducts }} <span class="text-sm font-medium text-slate-400">/ {{ products.length }}</span></p><p class="mt-1 text-xs text-slate-500">Published in the catalog</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between"><span class="text-xs font-semibold text-slate-500">Needs attention</span><span class="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">!</span></div>
        <p class="mt-3 text-2xl font-bold tracking-tight text-slate-900">{{ pendingPayments + lowStock }}</p><p class="mt-1 text-xs text-slate-500">{{ pendingPayments }} payments · {{ lowStock }} low-stock records</p>
      </article>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="flex items-start justify-between gap-3">
          <div><h3 class="text-sm font-bold text-slate-900">Revenue trend</h3><p class="mt-1 text-xs text-slate-500">Paid order totals over the last six months</p></div>
          <span class="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500">6 months</span>
        </div>
        <div v-if="!loading" class="mt-5">
          <div class="flex h-44 items-end gap-3 border-b border-slate-100 px-1">
            <div v-for="month in monthlySales" :key="month.key" class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span class="text-[10px] font-medium text-slate-500">{{ month.amount ? formatMoney(month.amount) : '—' }}</span>
              <div class="flex h-32 w-full items-end justify-center"><div :title="month.label + ': ' + formatMoney(month.amount)" class="w-full max-w-12 rounded-t-md bg-indigo-500 transition-all hover:bg-indigo-600" :style="{ height: Math.max(month.amount ? 5 : 2, month.amount / chartMax * 100) + '%' }"></div></div>
              <span class="text-[11px] font-medium text-slate-500">{{ month.label }}</span>
            </div>
          </div>
          <p v-if="!orders.length" class="mt-3 text-xs text-slate-400">Sales trend will populate as orders are placed and paid.</p>
        </div>
        <div v-else class="mt-5 h-44 animate-pulse rounded-lg bg-slate-50"></div>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div class="flex items-start justify-between"><div><h3 class="text-sm font-bold text-slate-900">Payment status</h3><p class="mt-1 text-xs text-slate-500">Current payment queue</p></div><RouterLink to="/admin/payments" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View all →</RouterLink></div>
        <div class="mt-4 flex items-end gap-2"><span class="text-3xl font-bold text-slate-900">{{ totalPayments }}</span><span class="pb-1 text-xs text-slate-400">payment records</span></div>
        <div class="mt-4 space-y-3">
          <div v-for="item in paymentStatuses" :key="item.status">
            <div class="mb-1 flex items-center justify-between gap-3"><span class="text-xs capitalize text-slate-600">{{ labelStatus(item.status) }}</span><span class="text-xs font-semibold text-slate-800">{{ item.count }}</span></div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full bg-indigo-500" :style="{ width: (totalPayments ? item.count / totalPayments * 100 : 0) + '%' }"></div></div>
          </div>
        </div>
      </article>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
      <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5"><div><h3 class="text-sm font-bold text-slate-900">Recent orders</h3><p class="mt-0.5 text-xs text-slate-500">Latest activity across your store</p></div><span class="text-xs text-slate-400">Latest 6</span></div>
        <div v-if="!loading && recentOrders.length" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th class="px-4 py-2.5 font-semibold">Order</th><th class="px-4 py-2.5 font-semibold">Date</th><th class="px-4 py-2.5 font-semibold">Total</th><th class="px-4 py-2.5 font-semibold">Payment</th></tr></thead>
            <tbody><tr v-for="order in recentOrders" :key="order.id" class="border-t border-slate-100"><td class="px-4 py-3 font-semibold text-slate-800">{{ order.orderNumber || String(order.id).slice(0, 8) }}</td><td class="whitespace-nowrap px-4 py-3 text-slate-500">{{ formatDate(order.createdAt) }}</td><td class="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">{{ formatMoney(order.total || order.subtotal) }}</td><td class="px-4 py-3"><span class="rounded-md bg-slate-100 px-2 py-1 capitalize text-slate-600">{{ labelStatus(order.paymentStatus || order.status) }}</span></td></tr></tbody>
          </table>
        </div>
        <p v-else-if="!loading" class="px-5 py-9 text-center text-xs text-slate-400">No orders yet. Orders will appear here when customers check out.</p>
        <div v-else class="h-48 animate-pulse bg-slate-50"></div>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 class="text-sm font-bold text-slate-900">Store operations</h3><p class="mt-1 text-xs text-slate-500">Catalog structure and stock health</p>
        <div class="mt-4 space-y-3">
          <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"><div><p class="text-xs font-semibold text-slate-700">Categories</p><p class="text-[11px] text-slate-500">{{ subcategories }} subcategories</p></div><span class="text-lg font-bold text-slate-900">{{ topCategories }}</span></div>
          <div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"><div><p class="text-xs font-semibold text-slate-700">Inventory records</p><p class="text-[11px] text-slate-500">Across warehouses</p></div><span class="text-lg font-bold text-slate-900">{{ inventory.length }}</span></div>
          <div class="flex items-center justify-between rounded-lg px-3 py-2.5" :class="lowStock ? 'bg-amber-50' : 'bg-emerald-50'"><div><p class="text-xs font-semibold" :class="lowStock ? 'text-amber-800' : 'text-emerald-800'">Stock alerts</p><p class="text-[11px]" :class="lowStock ? 'text-amber-700' : 'text-emerald-700'">{{ lowStock ? 'Replenishment may be needed' : 'No low-stock records' }}</p></div><span class="text-lg font-bold" :class="lowStock ? 'text-amber-800' : 'text-emerald-800'">{{ lowStock }}</span></div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <RouterLink to="/admin/products" class="rounded-lg bg-slate-900 px-3 py-2.5 text-center text-xs font-semibold text-white hover:bg-slate-700">Manage catalog</RouterLink>
          <RouterLink to="/admin/inventory" class="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50">Manage stock</RouterLink>
          <RouterLink to="/admin/categories" class="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50">Categories</RouterLink>
          <RouterLink to="/admin/payments" class="rounded-lg border border-slate-200 px-3 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50">Payments</RouterLink>
        </div>
      </article>
    </div>
    <p class="text-[11px] text-slate-400">Metrics reflect records currently returned by the API (up to 200 recent orders/payments). Revenue is based on orders marked paid, completed or delivered; it is not a forecast.</p>
  </section>
</template>
