<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../services/api'

const orders = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const statusFilter = ref('all')

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/orders/admin/all')
    orders.value = Array.isArray(response.data?.data) ? response.data.data : []
  } catch (err) {
    error.value = err.response?.data?.message || 'Orders could not be loaded. Confirm the backend is running and your admin session is valid.'
  } finally {
    loading.value = false
  }
}
const filteredOrders = computed(() => orders.value.filter(order => {
  const status = String(order.paymentStatus || order.status || 'pending').toLowerCase()
  const matchesStatus = statusFilter.value === 'all' || status === statusFilter.value
  const term = search.value.trim().toLowerCase()
  const matchesSearch = !term || [order.orderNumber, order.id, order.userId, order.currency].some(value => String(value || '').toLowerCase().includes(term))
  return matchesStatus && matchesSearch
}))
const totalValue = computed(() => filteredOrders.value.reduce((sum, order) => sum + Number(order.total ?? order.subtotal ?? 0), 0))
const formatMoney = order => new Intl.NumberFormat(undefined, { style: 'currency', currency: order.currency || 'ETB', maximumFractionDigits: 2 }).format(Number(order.total ?? order.subtotal ?? 0))
const formatDate = value => {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}
const statusClass = value => {
  const status = String(value || 'pending').toLowerCase()
  if (['paid', 'completed', 'delivered'].includes(status)) return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
  if (['cancelled', 'rejected', 'failed'].includes(status)) return 'bg-rose-50 text-rose-700 ring-rose-600/15'
  return 'bg-amber-50 text-amber-700 ring-amber-600/15'
}
onMounted(loadOrders)
</script>

<template>
  <section
    <p class="mb-3 text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Orders</span></p> class="space-y-5">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-[.15em] text-indigo-600">Commerce operations</p>
        <h2 class="text-sm font-semibold text-slate-800">Orders</h2>
        <p class="mt-1.5 max-w-2xl text-[13px] leading-5 text-slate-500">Review recent customer orders, their totals and payment state.</p>
      </div>
      <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60" :disabled="loading" @click="loadOrders"><span>↻</span>{{ loading ? 'Refreshing…' : 'Refresh orders' }}</button>
    </header>

    <div v-if="error" role="alert" class="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
      <span>{{ error }}</span><button type="button" class="shrink-0 font-semibold underline" @click="loadOrders">Retry</button>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[.02]"><p class="text-[12px] font-medium text-slate-500">Orders returned</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : orders.length }}</p><p class="mt-1 text-[11px] text-slate-400">Latest records from the API</p></article>
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[.02]"><p class="text-[12px] font-medium text-slate-500">Matching orders</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : filteredOrders.length }}</p><p class="mt-1 text-[11px] text-slate-400">Based on current filters</p></article>
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[.02]"><p class="text-[12px] font-medium text-slate-500">Value in view</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(totalValue) }}</p><p class="mt-1 text-[11px] text-slate-400">Filtered order totals, not paid revenue</p></article>
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[.02]">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 class="text-[13px] font-bold text-slate-900">Order register</h3><p class="mt-1 text-[11px] text-slate-500">Search by order number or customer identifier.</p></div>
        <div class="grid gap-2 sm:grid-cols-[minmax(200px,260px)_160px]">
          <input v-model="search" type="search" placeholder="Search orders…" aria-label="Search orders" class="w-full" />
          <select v-model="statusFilter" aria-label="Filter order status" class="w-full">
            <option value="all">All statuses</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="completed">Completed</option><option value="delivered">Delivered</option><option value="rejected">Rejected</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div v-if="loading" class="space-y-3 p-5"><div v-for="n in 5" :key="n" class="h-10 animate-pulse rounded-md bg-slate-50"></div></div>
      <div v-else-if="!error && !filteredOrders.length" class="px-6 py-14 text-center"><div class="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-lg text-slate-400">OR</div><p class="mt-3 text-[13px] font-semibold text-slate-800">{{ orders.length ? 'No orders match these filters' : 'No orders yet' }}</p><p class="mt-1 text-[12px] text-slate-500">{{ orders.length ? 'Try a different search or status.' : 'New customer checkouts will appear here.' }}</p></div>
      <div v-else-if="filteredOrders.length" class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-[12px]">
          <thead class="bg-slate-50/80 text-slate-500"><tr><th class="px-4 py-3">Order</th><th class="px-4 py-3">Customer ID</th><th class="px-4 py-3">Items</th><th class="px-4 py-3">Order total</th><th class="px-4 py-3">Payment state</th><th class="px-4 py-3">Placed</th></tr></thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id" class="border-t border-slate-100 transition hover:bg-slate-50/70">
              <td class="px-4 py-3.5"><p class="font-semibold text-slate-900">{{ order.orderNumber || 'Order ' + String(order.id).slice(0, 8) }}</p><p class="mt-0.5 font-mono text-[10px] text-slate-400">{{ String(order.id).slice(0, 16) }}</p></td>
              <td class="px-4 py-3.5 font-mono text-[11px] text-slate-500">{{ order.userId ? String(order.userId).slice(0, 12) : '—' }}</td>
              <td class="px-4 py-3.5 text-slate-600">{{ Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) : '—' }}</td>
              <td class="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900">{{ formatMoney(order) }}</td>
              <td class="px-4 py-3.5"><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset" :class="statusClass(order.paymentStatus || order.status)">{{ String(order.paymentStatus || order.status || 'pending').replaceAll('_', ' ') }}</span></td>
              <td class="whitespace-nowrap px-4 py-3.5 text-slate-500">{{ formatDate(order.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Showing {{ filteredOrders.length }} of {{ orders.length }} loaded orders</span><span>Order data is read from the backend; this page does not alter order or payment status.</span></div>
    </div>
  </section>
</template>
