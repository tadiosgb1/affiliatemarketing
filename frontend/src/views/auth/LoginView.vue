<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import api from '../../services/api'
import { setAuth } from '../../stores'

const router = useRouter()
const identifier = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.post('/auth/login', {
      identifier: identifier.value.trim(),
      password: password.value,
    })
    const data = response.data?.data
    if (!data?.user || !data?.token) throw new Error('The server response was incomplete.')
    setAuth(data.user, data.token)
    await router.push(data.user.role === 'admin' || data.user.role === 'company_staff' ? '/admin' : '/shop')
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Unable to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <div class="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
      <p class="text-sm font-bold uppercase tracking-wider text-indigo-600">Welcome back</p>
      <h1 class="mt-2 text-3xl font-black">Sign in to MarketFlow</h1>
      <p class="mt-2 text-sm text-slate-500">Use your email address or phone number to access your account.</p>

      <p v-if="error" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label for="login-identifier" class="mb-1 block text-sm font-semibold">Email or phone number</label>
          <input id="login-identifier" v-model="identifier" type="text" autocomplete="username" required placeholder="you@example.com or +2519..." class="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label for="login-password" class="mb-1 block text-sm font-semibold">Password</label>
          <input id="login-password" v-model="password" type="password" autocomplete="current-password" required class="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500" />
        </div>
        <button type="submit" :disabled="loading" class="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-60">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-5 text-center text-sm text-slate-600">New to MarketFlow? <RouterLink to="/register" class="font-bold text-indigo-600">Create an account</RouterLink></p>
    </div>
  </section>
</template>