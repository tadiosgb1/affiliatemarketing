<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import api from '../../services/api'
import { setAuth } from '../../stores'

const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.post('/auth/register', {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    const data = response.data?.data
    if (!data?.user || !data?.token) throw new Error('The server response was incomplete.')
    setAuth(data.user, data.token)
    await router.push('/shop')
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Unable to create your account. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-md">
    <div class="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
      <p class="text-sm font-bold uppercase tracking-wider text-indigo-600">Join MarketFlow</p>
      <h1 class="mt-2 text-3xl font-black">Create your account</h1>
      <p class="mt-2 text-sm text-slate-500">One account for shopping and affiliate marketing.</p>

      <p v-if="error" role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label for="register-name" class="mb-1 block text-sm font-semibold">Full name</label>
          <input id="register-name" v-model="name" type="text" autocomplete="name" minlength="2" maxlength="120" required class="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label for="register-email" class="mb-1 block text-sm font-semibold">Email</label>
          <input id="register-email" v-model="email" type="email" autocomplete="email" required class="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label for="register-password" class="mb-1 block text-sm font-semibold">Password</label>
          <input id="register-password" v-model="password" type="password" autocomplete="new-password" minlength="8" required class="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500" />
          <p class="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
        </div>
        <button type="submit" :disabled="loading" class="w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-60">
          {{ loading ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="mt-5 text-center text-sm text-slate-600">Already registered? <RouterLink to="/login" class="font-bold text-indigo-600">Sign in</RouterLink></p>
    </div>
  </section>
</template>
