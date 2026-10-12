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
    const response = await api.get('/payments/admin/all')
    payments.value = response.data?.data ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load payment records. Please sign in and check the API connection.'
  } finally {
    loading.value = false
  }
}

async function verifyPayment(payment, status) {
  error.value = ''
  try {
    await api.patch('/payments/' + payment.id + '/verify', { status })
    payment.status = status
    success.value = 'Payment marked ' + status + '.'
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not update payment status.'
  }
}

const success = ref('')

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
      <p class="mt-2 text-slate-500">Review customer payments and approve or reject submitted payments.</p>
    </header>

    <p v-if="success" role="status" class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{{ success }}</p>\n    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

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
              <th class="p-4 font-semibold">Created</th>\n              <th class="p-4 font-semibold">Review</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id" class="border-t">
              <td class="p-4 font-mono text-xs">{{ payment.orderId || '—' }}</td>
              <td class="p-4">{{ (payment.method || '—').replaceAll('_', ' ') }}</td>
              <td class="p-4">{{ payment.amount ?? '—' }} {{ payment.currency || '' }}</td>
              <td class="p-4"><span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{{ (payment.status || 'unknown').replaceAll('_', ' ') }}</span></td>
              <td class="p-4 text-slate-500">{{ formatDate(payment.createdAt) }}</td>
              <td class="p-4"><div v-if="!['paid', 'rejected', 'failed'].includes(payment.status)" class="flex gap-2"><button class="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white" @click="verifyPayment(payment, 'paid')">Approve</button><button class="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-bold text-white" @click="verifyPayment(payment, 'rejected')">Reject</button></div><span v-else class="text-xs text-slate-400">Reviewed</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
