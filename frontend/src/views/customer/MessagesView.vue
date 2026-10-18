<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../../services/api'
const messages = ref([])
const loading = ref(true)
const error = ref('')
onMounted(async () => {
  try {
    const response = await api.get('/messages/mine')
    const data = response.data?.data ?? response.data?.messages ?? response.data
    messages.value = Array.isArray(data) ? data : (data?.rows || data?.items || data?.messages || [])
  } catch (err) {
    if (err.response?.status !== 404) error.value = err.response?.data?.message || 'Messages are temporarily unavailable.'
  } finally { loading.value = false }
})
</script>

<template>
  <section class="mx-auto max-w-4xl">
    <p class="text-[10px] font-extrabold uppercase tracking-[.25em] text-stone-500">{{ $t('messages.inbox') }}</p>
    <h1 class="mt-2 text-4xl font-black tracking-[-.06em]">{{ $t('messages.title') }}</h1>
    <p class="mt-3 text-sm text-stone-500">{{ $t('messages.description') }}</p>
    <p v-if="error" role="alert" class="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{{ error }}</p>
    <div v-else-if="loading" class="mt-8 animate-pulse rounded-2xl border border-stone-200 bg-white p-8 text-sm text-stone-400">{{ $t('messages.loading') }}</div>
    <div v-else-if="messages.length" class="mt-8 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
      <article v-for="message in messages" :key="message.id" class="p-5"><p class="font-bold">{{ message.subject || message.title || 'Message from the store' }}</p><p class="mt-2 text-sm leading-6 text-stone-600">{{ message.message || message.body || message.content }}</p><p v-if="message.createdAt" class="mt-3 text-xs text-stone-400">{{ new Date(message.createdAt).toLocaleString() }}</p></article>
    </div>
    <div v-else class="mt-8 rounded-2xl border border-dashed border-stone-300 p-10 text-center"><p class="text-3xl">✉</p><h2 class="mt-3 text-lg font-black">You're all caught up</h2><p class="mt-2 text-sm text-stone-500">{{ $t('messages.empty_description') }}</p><RouterLink to="/orders" class="mt-5 inline-flex rounded-full bg-stone-950 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white">{{ $t('messages.view_orders') }}</RouterLink></div>
  </section>
</template>