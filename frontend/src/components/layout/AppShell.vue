<script setup>
import {ref} from 'vue'
import {RouterLink} from 'vue-router'
import {auth,cartCount,logout} from '../../stores'
const mobile=ref(false)
</script>
<template><div class="min-h-screen">
<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
 <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
  <RouterLink to="/shop" class="text-xl font-black tracking-tight text-slate-950">Market<span class="text-indigo-600">Flow</span></RouterLink>
  <nav class="hidden items-center gap-7 md:flex"><RouterLink class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/shop">Shop</RouterLink><RouterLink class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/orders">Orders</RouterLink><RouterLink class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/affiliate">Affiliate</RouterLink><RouterLink v-if="auth.user?.role==='admin'||auth.user?.role==='company_staff'" class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/admin">Management</RouterLink></nav>
  <div class="flex items-center gap-2"><RouterLink to="/cart" class="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">Cart <span class="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{{cartCount}}</span></RouterLink><RouterLink v-if="!auth.user" to="/login" class="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Sign in</RouterLink><button v-else @click="logout" class="rounded-xl border px-3 py-2 text-sm">Sign out</button></div>
 </div>
</header><main class="mx-auto max-w-7xl px-4 py-8"><slot/></main>
<footer class="mt-16 border-t bg-white"><div class="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500">© {{new Date().getFullYear()}} MarketFlow · One-company commerce & affiliate platform</div></footer>
</div></template>