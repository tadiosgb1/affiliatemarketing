<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { auth, cartCount, logout } from '../../stores'
import api from '../../services/api'
const mobile=ref(false)
const brand=ref({platformName:'',name:'',tagline:'',logoUrl:'',primaryColor:'#4f46e5'})
const brandName=computed(()=>brand.value.platformName||brand.value.name||'MarketFlow')
const roleSlugs=computed(()=> (auth.user?.roles||[]).map(role=>typeof role==='string'?role:role.slug))
const canManage=computed(()=>['admin','company_staff'].includes(String(auth.user?.role||'').toLowerCase())||roleSlugs.value.some(role=>!['customer','affiliate'].includes(role))||(auth.user?.permissions||[]).some(permission=>permission.endsWith('.manage')||permission==='dashboard.view'))
function onPlatformBrandUpdated(event){brand.value={...brand.value,...(event.detail||{})}}
onMounted(async()=>{
 window.addEventListener('platform-brand-updated',onPlatformBrandUpdated)
 try{
  const response=await api.get('/company/brand')
  brand.value={...brand.value,...(response.data?.data||{})}
  if(/^#[0-9a-f]{6}$/i.test(brand.value.primaryColor||''))document.documentElement.style.setProperty('--platform-primary',brand.value.primaryColor)
 }catch{/* Use fallback branding until a company profile is configured. */}
})
onUnmounted(()=>window.removeEventListener('platform-brand-updated',onPlatformBrandUpdated))
</script>
<template>
<div class="min-h-screen">
<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
 <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
  <RouterLink to="/shop" class="flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
   <img v-if="brand.logoUrl" :src="brand.logoUrl" :alt="brandName+' logo'" class="h-8 w-8 object-contain"/>
   <span v-else class="flex h-8 w-8 items-center justify-center rounded-md text-sm text-white" :style="{backgroundColor:brand.primaryColor||'#4f46e5'}">{{brandName.slice(0,1).toUpperCase()}}</span>
   <span>{{brandName}}</span>
  </RouterLink>
  <nav class="hidden items-center gap-7 md:flex"><RouterLink class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/shop">Shop</RouterLink><RouterLink class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/orders">Orders</RouterLink><RouterLink class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/affiliate">Affiliate</RouterLink><RouterLink v-if="canManage" class="text-sm font-medium text-slate-600 hover:text-indigo-600" to="/admin">Management</RouterLink></nav>
  <div class="flex items-center gap-2"><RouterLink to="/cart" class="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">Cart <span class="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{{cartCount}}</span></RouterLink><RouterLink v-if="!auth.user" to="/login" class="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Sign in</RouterLink><button v-else @click="logout" class="rounded-xl border px-3 py-2 text-sm">Sign out</button></div>
 </div>
</header><main class="mx-auto max-w-7xl px-4 py-8"><slot/></main>
<footer class="mt-16 border-t bg-white"><div class="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500">© {{new Date().getFullYear()}} {{brandName}}<span v-if="brand.tagline"> · {{brand.tagline}}</span></div></footer>
</div>
</template>
