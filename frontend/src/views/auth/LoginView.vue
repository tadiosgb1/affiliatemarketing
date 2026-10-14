<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import api from '../../services/api'
import { setAuth } from '../../stores'

const router = useRouter()
const route = useRoute()
const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref(route.query.session === 'expired' ? 'Your session expired or the token was rejected. Please sign in again.' : '')

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
    const role = String(data.user.role || '').toLowerCase()
    await router.push(['admin', 'company_staff'].includes(role) ? '/admin' : (route.query.redirect || '/products'))
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Unable to sign in. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-screen min-h-screen bg-white">
    <div class="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <aside class="auth-story relative hidden overflow-hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div class="auth-orb auth-orb-one"></div>
        <div class="auth-orb auth-orb-two"></div>
        <RouterLink to="/" class="relative z-10 inline-flex w-fit items-center gap-3 text-xl font-black tracking-tight">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-lg">M</span>
          Market<span class="text-indigo-300">Flow</span>
        </RouterLink>
        <div class="relative z-10 my-auto max-w-xl py-16">
          <p class="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-indigo-300">Your next great find</p>
          <h2 class="max-w-lg text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">Good things are just around the corner.</h2>
          <p class="mt-6 max-w-md text-base leading-7 text-slate-300">Sign in to pick up where you left off, discover products you’ll love, and keep everything you need in one place.</p>
          <div class="mt-10 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
            <div class="flex -space-x-2">
              <span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-200 text-sm">✦</span>
              <span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-indigo-200 text-sm">♡</span>
              <span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-200 text-sm">✓</span>
            </div>
            <div><p class="text-sm font-semibold">A smoother way to shop</p><p class="mt-1 text-xs text-slate-400">Your account, orders and saved items together.</p></div>
          </div>
        </div>
        <p class="relative z-10 text-xs text-slate-500">Thoughtful finds. A better everyday.</p>
      </aside>

      <section class="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
        <div class="w-full max-w-md">
          <div class="mb-10 flex items-center justify-between lg:hidden">
            <RouterLink to="/" class="inline-flex items-center gap-2 text-lg font-black tracking-tight text-slate-950"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">M</span>Market<span class="text-indigo-600">Flow</span></RouterLink>
            <RouterLink to="/products" class="text-sm font-semibold text-slate-500 hover:text-indigo-600">Explore shop ↗</RouterLink>
          </div>
          <RouterLink to="/" class="mb-10 hidden items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600 lg:inline-flex">← Back to storefront</RouterLink>
          <div class="mb-8">
            <p class="text-sm font-bold text-indigo-600">WELCOME BACK</p>
            <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Sign in to your account</h1>
            <p class="mt-3 text-sm leading-6 text-slate-500">Enter your details below to continue shopping with MarketFlow.</p>
          </div>

          <p v-if="error" role="alert" class="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-700"><span aria-hidden="true">!</span><span>{{ error }}</span></p>

          <form class="space-y-5" @submit.prevent="submit">
            <div>
              <label for="login-identifier" class="mb-2 block text-sm font-semibold text-slate-700">Email address or phone</label>
              <input id="login-identifier" v-model="identifier" type="text" autocomplete="username" required placeholder="you@example.com or +251..." class="auth-input w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
            </div>
            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <label for="login-password" class="block text-sm font-semibold text-slate-700">Password</label>
              </div>
              <div class="relative">
                <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required placeholder="Enter your password" class="auth-input w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-20 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                <button type="button" class="absolute inset-y-0 right-3 my-auto h-9 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
              </div>
            </div>
            <button type="submit" :disabled="loading" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
              {{ loading ? 'Signing you in…' : 'Sign in' }}
              <span v-if="!loading" aria-hidden="true">→</span>
            </button>
          </form>

          <div class="my-7 flex items-center gap-3 text-xs text-slate-400"><span class="h-px flex-1 bg-slate-200"></span><span>YOUR SHOPPING, ALL IN ONE PLACE</span><span class="h-px flex-1 bg-slate-200"></span></div>
          <p class="text-center text-sm text-slate-600">New to MarketFlow? <RouterLink to="/register" class="font-bold text-indigo-600 hover:text-indigo-700">Create an account</RouterLink></p>
          <p class="mt-8 text-center text-xs leading-5 text-slate-400">By continuing, you agree to use your account responsibly and keep your sign-in details secure.</p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-story { isolation: isolate; }
.auth-story::before { position: absolute; inset: 0; content: ""; background: radial-gradient(ellipse at 75% 30%, rgb(99 102 241 / 25%), transparent 48%), linear-gradient(145deg, transparent 35%, rgb(79 70 229 / 12%)); pointer-events: none; }
.auth-orb { position: absolute; border: 1px solid rgb(255 255 255 / 9%); border-radius: 9999px; pointer-events: none; }
.auth-orb-one { width: 34rem; height: 34rem; right: -14rem; top: 14%; }
.auth-orb-two { width: 24rem; height: 24rem; right: -9rem; top: 23%; background: radial-gradient(circle, rgb(99 102 241 / 13%), transparent 68%); }
.auth-input { min-height: 50px; }
</style>