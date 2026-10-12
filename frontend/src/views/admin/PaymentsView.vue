<script setup>
import { onMounted, ref } from 'vue'
import api from '../../services/api'

const payments = ref([])
const loading = ref(true)
const error = ref('')

async function loadPayments() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/payments/mine')
    payments.value = response.data?.data ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load payment records. Please sign in and check the API connection.'
  } finally {
    loading.value = false
  }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

onMounted(loadPayments)
</script>

<template>
  <section class="space-y-6">
    <header>
      <p class="text-sm font-bold uppercase tracking-wider text-indigo-600">Commerce</p>
      <h1 class="mt-1 text-3xl font-black">Payments</h1>
      <p class="mt-2 text-slate-500">Review payment records associated with your account.</p>
    </header>

    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div class="overflow-hidden rounded-2xl border bg-white">
      <div class="flex items-center justify-between border-b p-4">
        <h2 class="font-bold">Payment history</h2>
        <button type="button" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800" @click="loadPayments">Refresh</button>
      </div>

      <p v-if="loading" class="p-6 text-sm text-slate-500">Loading payments…</p>
      <p v-else-if="payments.length === 0 && !error" class="p-6 text-sm text-slate-500">No payment records found.</p>
      <div v-else-if="payments.length" class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="p-4 font-semibold">Order</th>
              <th class="p-4 font-semibold">Method</th>
              <th class="p-4 font-semibold">Amount</th>
              <th class="p-4 font-semibold">Status</th>
              <th class="p-4 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id" class="border-t">
              <td class="p-4 font-mono text-xs">{{ payment.orderId || '—' }}</td>
              <td class="p-4">{{ (payment.method || '—').replaceAll('_', ' ') }}</td>
              <td class="p-4">{{ payment.amount ?? '—' }} {{ payment.currency || '' }}</td>
              <td class="p-4"><span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{{ (payment.status || 'unknown').replaceAll('_', ' ') }}</span></td>
              <td class="p-4 text-slate-500">{{ formatDate(payment.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
