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
  <main class="auth-screen min-h-screen bg-[#faf9f6]">
    <div class="min-h-screen">
      <section class="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
        <div class="w-full max-w-md">
          <div class="mb-10 flex items-center justify-between lg:hidden">
            <RouterLink to="/" class="inline-flex items-center gap-2 text-lg font-black tracking-tight text-stone-950"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-950 text-white">M</span>Market<span class="text-stone-700">Flow</span></RouterLink>
            <RouterLink to="/products" class="text-sm font-semibold text-stone-600 hover:text-stone-700">Explore shop ↗</RouterLink>
          </div>
          <RouterLink to="/" class="mb-10 hidden items-center gap-2 text-sm font-semibold text-stone-600 transition hover:text-stone-700 lg:inline-flex">← Back to storefront</RouterLink>
          <div class="mb-8">
            <p class="text-sm font-bold text-stone-700">{{ $t('auth.welcome_back') }}</p>
            <h1 class="mt-3 text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">{{ $t('auth.sign_in') }}</h1>
            <p class="mt-3 text-sm leading-6 text-stone-600">{{ $t('auth.login_intro') }}</p>
          </div>

          <p v-if="error" role="alert" class="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-700"><span aria-hidden="true">!</span><span>{{ error }}</span></p>

          <form class="space-y-5" @submit.prevent="submit">
            <div>
              <label for="login-identifier" class="mb-2 block text-sm font-semibold text-stone-800">{{ $t('auth.email_or_phone') }}</label>
              <input id="login-identifier" v-model="identifier" type="text" autocomplete="username" required placeholder="you@example.com or +251..." class="auth-input w-full rounded-xl border border-stone-300 bg-[#faf9f6] px-4 py-3.5 text-sm outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-900/10" />
            </div>
            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <label for="login-password" class="block text-sm font-semibold text-stone-800">Password</label>
              </div>
              <div class="relative">
                <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required placeholder=:placeholder="$t('auth.enter_password')" class="auth-input w-full rounded-xl border border-stone-300 bg-[#faf9f6] px-4 py-3.5 pr-20 text-sm outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-900/10" />
                <button type="button" class="absolute inset-y-0 right-3 my-auto h-9 rounded-lg px-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">{{ showPassword ? 'Hide' : 'Show' }}</button>
              </div>
            </div>
            <button type="submit" :disabled="loading" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-stone-950/10 transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60">
              <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
              {{ loading ? 'Signing you in…' : 'Sign in' }}
              <span v-if="!loading" aria-hidden="true">→</span>
            </button>
          </form>

          <div class="my-7 flex items-center gap-3 text-xs text-stone-500"><span class="h-px flex-1 bg-slate-200"></span><span>{{ $t('auth.shopping_tagline') }}</span><span class="h-px flex-1 bg-slate-200"></span></div>
          <p class="text-center text-sm text-stone-600">New to MarketFlow? <RouterLink to="/register" class="font-bold text-stone-700 hover:text-stone-950">{{ $t('auth.create_account') }}</RouterLink></p>
          <p class="mt-8 text-center text-xs leading-5 text-stone-500">By continuing, you agree to use your account responsibly and keep your sign-in details secure.</p>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-input { min-height: 50px; }

/* Match the storefront's warm neutral palette and guarantee readable controls. */
.auth-screen { color: #1c1917; }
.auth-screen :deep(button[type="submit"]) {
  background-color: #1c1917 !important;
  color: #ffffff !important;
}
.auth-screen :deep(button[type="submit"]:hover:not(:disabled)) {
  background-color: #44403c !important;
  color: #ffffff !important;
}
.auth-screen :deep(button[type="submit"]:disabled) {
  background-color: #57534e !important;
  color: #ffffff !important;
}
.auth-screen :deep(button[type="button"]) {
  color: #44403c !important;
  background-color: #ffffff !important;
}
.auth-screen :deep(a.text-stone-700),
.auth-screen :deep(a.text-stone-950) { color: #292524 !important; }
.auth-screen :deep(input) { color: #1c1917 !important; }
.auth-screen :deep(input::placeholder) { color: #78716c !important; opacity: 1; }
</style>