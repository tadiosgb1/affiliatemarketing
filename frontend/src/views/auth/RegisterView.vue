<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import api from '../../services/api'
import { setAuth } from '../../stores'

const router = useRouter()
const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.post('/auth/register', {
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim() || undefined,
      password: password.value,
    })
    const data = response.data?.data
    if (!data?.user || !data?.token) throw new Error('The server response was incomplete.')
    setAuth(data.user, data.token)
    await router.push('/products')
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Unable to create your account. Please try again.'
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
        <RouterLink to="/" class="relative z-10 inline-flex w-fit items-center gap-3 text-xl font-black tracking-tight"><span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-lg">M</span>Market<span class="text-indigo-300">Flow</span></RouterLink>
        <div class="relative z-10 my-auto max-w-xl py-16">
          <p class="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-indigo-300">Make room for better finds</p>
          <h2 class="max-w-lg text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">Your next favorite thing starts here.</h2>
          <p class="mt-6 max-w-md text-base leading-7 text-slate-300">Create your free account to explore the catalog, save the things you love, and keep your shopping journey organized.</p>
          <div class="mt-10 space-y-4">
            <div class="flex items-center gap-3"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-indigo-200">✓</span><span class="text-sm text-slate-200">Discover products picked for everyday life</span></div>
            <div class="flex items-center gap-3"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-indigo-200">♡</span><span class="text-sm text-slate-200">Keep your favorite finds close</span></div>
            <div class="flex items-center gap-3"><span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-indigo-200">↗</span><span class="text-sm text-slate-200">One account for shopping and affiliate features</span></div>
          </div>
        </div>
        <p class="relative z-10 text-xs text-slate-500">Thoughtful finds. A better everyday.</p>
      </aside>

      <section class="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
        <div class="w-full max-w-md">
          <div class="mb-8 flex items-center justify-between lg:hidden">
            <RouterLink to="/" class="inline-flex items-center gap-2 text-lg font-black tracking-tight text-slate-950"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">M</span>Market<span class="text-indigo-600">Flow</span></RouterLink>
            <RouterLink to="/products" class="text-sm font-semibold text-slate-500 hover:text-indigo-600">Explore shop ↗</RouterLink>
          </div>
          <RouterLink to="/" class="mb-7 hidden items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600 lg:inline-flex">← Back to storefront</RouterLink>
          <div class="mb-7">
            <p class="text-sm font-bold text-indigo-600">JOIN MARKETFLOW</p>
            <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Create your account</h1>
            <p class="mt-3 text-sm leading-6 text-slate-500">A few details and you’ll be ready to discover something great.</p>
          </div>

          <p v-if="error" role="alert" class="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-700"><span aria-hidden="true">!</span><span>{{ error }}</span></p>

          <form class="space-y-4" @submit.prevent="submit">
            <div>
              <label for="register-name" class="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
              <input id="register-name" v-model="name" type="text" autocomplete="name" minlength="2" maxlength="120" required placeholder="Your full name" class="auth-input w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
            </div>
            <div>
              <label for="register-email" class="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
              <input id="register-email" v-model="email" type="email" autocomplete="email" required placeholder="you@example.com" class="auth-input w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
            </div>
            <div>
              <label for="register-phone" class="mb-2 block text-sm font-semibold text-slate-700">Phone number <span class="font-normal text-slate-400">(optional)</span></label>
              <input id="register-phone" v-model="phone" type="tel" autocomplete="tel" placeholder="+251 9..." class="auth-input w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
            </div>
            <div>
              <label for="register-password" class="mb-2 block text-sm font-semibold text-slate-700">Create a password</label>
              <div class="relative">
                <input id="register-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters" class="auth-input w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-20 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                <button type="button" class="absolute inset-y-0 right-3 my-auto h-9 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
              </div>
              <p class="mt-2 text-xs leading-5 text-slate-500">Choose at least 8 characters and keep your password private.</p>
            </div>
            <button type="submit" :disabled="loading" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
              <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
              {{ loading ? 'Creating your account…' : 'Create account' }}
              <span v-if="!loading" aria-hidden="true">→</span>
            </button>
          </form>

          <p class="mt-7 text-center text-sm text-slate-600">Already have an account? <RouterLink to="/login" class="font-bold text-indigo-600 hover:text-indigo-700">Sign in</RouterLink></p>
          <p class="mt-7 text-center text-xs leading-5 text-slate-400">Your details are used to set up your MarketFlow account.</p>
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