<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const rows = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const statusFilter = ref('all')
const configs = {
  'affiliate-links': { title: 'Affiliate links', eyebrow: 'Growth & partnerships', description: 'Monitor tracking links, traffic and attributed conversions.', endpoint: '/affiliate-links/admin/all', columns: [{key:'code',label:'Tracking code'},{key:'affiliate',label:'Affiliate'},{key:'program',label:'Program'},{key:'clicks',label:'Clicks'},{key:'conversions',label:'Conversions'},{key:'isActive',label:'Status',kind:'active'}] },
  'inventory-movements': { title: 'Inventory movements', eyebrow: 'Operations', description: 'Audit stock adjustments and transfers across warehouses.', endpoint: '/inventory/movements/admin/all', columns: [{key:'type',label:'Movement',kind:'status'},{key:'variant',label:'Product',kind:'variant'},{key:'warehouse',label:'Warehouse',kind:'warehouse'},{key:'quantity',label:'Quantity'},{key:'creator',label:'Recorded by',kind:'creator'},{key:'createdAt',label:'Date',kind:'date'}] },
  commissions: { title: 'Commissions', eyebrow: 'Finance', description: 'Review attributed sales and commission amounts earned by affiliates.', endpoint: '/commissions/admin/all', columns: [{key:'orderId',label:'Order reference'},{key:'affiliate',label:'Affiliate'},{key:'baseAmount',label:'Sale base',kind:'money'},{key:'rate',label:'Rate',kind:'rate'},{key:'amount',label:'Commission',kind:'money'},{key:'status',label:'Status',kind:'status'}] },
  payouts: { title: 'Payouts', eyebrow: 'Finance', description: 'Track affiliate payout requests, destinations and payment status.', endpoint: '/payouts/admin/all', columns: [{key:'affiliate',label:'Affiliate'},{key:'amount',label:'Amount',kind:'money'},{key:'method',label:'Method'},{key:'destination',label:'Destination',kind:'destination'},{key:'createdAt',label:'Requested',kind:'date'},{key:'status',label:'Status',kind:'status'}] },
}
const key = computed(() => route.path.split('/').filter(Boolean).at(-1))
const config = computed(() => configs[key.value] || configs['affiliate-links'])
const filteredRows = computed(() => rows.value.filter(row => {
  const term = search.value.trim().toLowerCase()
  const haystack = [row.code,row.orderId,row.status,row.method,row.affiliate?.name,row.affiliate?.email,row.program?.name,row.amount].some(v => String(v ?? '').toLowerCase().includes(term))
  const status = String(row.status || (row.isActive === false ? 'inactive' : 'active')).toLowerCase()
  return (!term || haystack) && (statusFilter.value === 'all' || status === statusFilter.value)
}))
const totalAmount = computed(() => rows.value.reduce((sum,row) => sum + Number(row.amount || 0),0))
const totalClicks = computed(() => rows.value.reduce((sum,row) => sum + Number(row.clicks || 0),0))
const totalConversions = computed(() => rows.value.reduce((sum,row) => sum + Number(row.conversions || 0),0))
const money = value => new Intl.NumberFormat(undefined,{style:'currency',currency:'ETB',maximumFractionDigits:2}).format(Number(value)||0)
function valueFor(row,col) {
  const value=row[col.key]
  if(col.key==='affiliate') return value?.name || value?.email || 'Unknown affiliate'
  if(col.key==='program') return value?.name || 'General program'
  if(col.kind==='variant') return value?.product?.name ? value.product.name + (value.sku ? ' · ' + value.sku : '') : value?.sku || '—'
  if(col.kind==='warehouse') return value?.name || value?.code || '—'
  if(col.kind==='creator') return value?.name || value?.email || 'System'
  if(col.kind==='active') return row.isActive===false?'Inactive':'Active'
  if(col.kind==='money') return money(value)
  if(col.kind==='rate') return Number(value)?Number(value)+'%':'Fixed'
  if(col.kind==='destination') { if(!value)return '—'; if(typeof value==='string')return value; return Object.values(value).filter(Boolean).join(' · ')||'On file' }
  if(col.kind==='date') {const d=new Date(value);return value&&!Number.isNaN(d.getTime())?d.toLocaleDateString():'—'}
  if(col.key==='orderId') return value?String(value).slice(0,8).toUpperCase():'—'
  return value===null||value===undefined||value===''?'—':String(value).replaceAll('_',' ')
}
function statusClass(row,col) {
  const v=String(col.kind==='active'?(row.isActive===false?'inactive':'active'):row.status||'pending').toLowerCase()
  if(['active','approved','paid','completed'].includes(v))return 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
  if(['rejected','reversed','inactive','cancelled'].includes(v))return 'bg-slate-100 text-slate-600 ring-slate-500/10'
  if(['processing','pending','requested'].includes(v))return 'bg-amber-50 text-amber-700 ring-amber-600/10'
  return 'bg-indigo-50 text-indigo-700 ring-indigo-600/10'
}
async function load() {
  loading.value=true;error.value=''
  try { const response=await api.get(config.value.endpoint);rows.value=Array.isArray(response.data?.data)?response.data.data:[] }
  catch(err) { error.value=err.response?.data?.message||'Could not load this report. Confirm the API is running and your admin session is valid.';rows.value=[] }
  finally {loading.value=false}
}
watch(key,()=>{search.value='';statusFilter.value='all';load()})
onMounted(load)
</script>

<template>
  <section class="admin-page space-y-6">
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p class="text-[11px] font-bold uppercase tracking-[.13em] text-indigo-600">{{ config.eyebrow }}</p><h2 class="mt-1 text-[26px] font-bold leading-tight text-slate-900">{{ config.title }}</h2><p class="mt-2 max-w-2xl text-[13px] leading-5 text-slate-500">{{ config.description }}</p></div>
      <button type="button" class="admin-secondary-btn inline-flex items-center justify-center gap-2" :disabled="loading" @click="load"><span aria-hidden="true">↻</span>{{ loading ? 'Refreshing…' : 'Refresh data' }}</button>
    </header>
    <div v-if="error" role="alert" class="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800"><span>{{ error }}</span><button type="button" class="shrink-0 font-semibold underline" @click="load">Try again</button></div>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <article class="admin-panel p-4"><p class="text-[12px] font-medium text-slate-500">{{ config.title }} records</p><p class="mt-2 text-[26px] font-bold tracking-tight text-slate-900">{{ loading?'—':rows.length.toLocaleString() }}</p><p class="mt-1 text-[11px] text-slate-400">Records returned by the API</p></article>
      <article class="admin-panel p-4"><p class="text-[12px] font-medium text-slate-500">{{ key==='affiliate-links'?'Tracked clicks':key==='inventory-movements'?'Movement quantity':key==='commissions'?'Commission value':'Payout value' }}</p><p class="mt-2 text-[26px] font-bold tracking-tight text-slate-900">{{ loading?'—':key==='affiliate-links'?totalClicks.toLocaleString():key==='inventory-movements'?rows.reduce((sum,row)=>sum+Number(row.quantity||0),0).toLocaleString():money(totalAmount) }}</p><p class="mt-1 text-[11px] text-slate-400">{{ key==='affiliate-links'?'Across listed affiliate links':key==='inventory-movements'?'Units moved in listed records':'Sum of listed record amounts' }}</p></article>
      <article class="admin-panel p-4"><p class="text-[12px] font-medium text-slate-500">{{ key==='affiliate-links'?'Attributed conversions':key==='inventory-movements'?'Unique warehouses':'Matching records' }}</p><p class="mt-2 text-[26px] font-bold tracking-tight text-slate-900">{{ loading?'—':key==='affiliate-links'?totalConversions.toLocaleString():key==='inventory-movements'?new Set(rows.map(row=>row.warehouseId)).size.toLocaleString():filteredRows.length.toLocaleString() }}</p><p class="mt-1 text-[11px] text-slate-400">{{ key==='affiliate-links'?'Recorded by the tracking model':key==='inventory-movements'?'Warehouses with recorded movement':'Current filter result' }}</p></article>
    </div>
    <div class="admin-table-wrap">
      <div class="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div><h3 class="text-[13px] font-bold text-slate-900">Record register</h3><p class="mt-1 text-[11px] text-slate-500">{{ loading?'Loading records…':filteredRows.length+' records shown' }}</p></div>
        <div class="flex flex-col gap-2 sm:flex-row"><input v-model="search" type="search" :placeholder="'Search '+config.title.toLowerCase()+'…'" class="sm:w-[240px]" /><select v-model="statusFilter" aria-label="Filter by status" class="sm:w-[150px]"><option value="all">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="requested">Requested</option><option value="processing">Processing</option><option value="paid">Paid</option><option value="rejected">Rejected</option><option value="inactive">Inactive</option></select></div>
      </div>
      <div v-if="loading" class="space-y-3 p-5"><div v-for="n in 5" :key="n" class="h-9 animate-pulse rounded-md bg-slate-100"></div></div>
      <div v-else-if="!filteredRows.length" class="px-6 py-14 text-center"><div class="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-500">⌕</div><p class="mt-3 text-[13px] font-semibold text-slate-800">No matching records</p><p class="mt-1 text-[12px] text-slate-500">Try changing your search or status filter.</p></div>
      <div v-else class="overflow-x-auto"><table class="min-w-[760px] text-left"><thead><tr><th v-for="column in config.columns" :key="column.key">{{ column.label }}</th></tr></thead><tbody><tr v-for="row in filteredRows" :key="row.id"><td v-for="column in config.columns" :key="column.key"><span v-if="column.kind==='active'||column.kind==='status'" class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset" :class="statusClass(row,column)">{{ valueFor(row,column) }}</span><span v-else :class="['affiliate','program','amount','code'].includes(column.key)?'font-semibold text-slate-900':''">{{ valueFor(row,column) }}</span></td></tr></tbody></table></div>
      <div class="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] text-slate-400">Read-only management report · Values are returned by the backend.</div>
    </div>
  </section>
</template>
