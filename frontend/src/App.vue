<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from './stores'
import api from './services/api'
import AppShell from './components/layout/AppShell.vue'
import AdminLayout from './components/layout/AdminLayout.vue'

const route = useRoute()
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const isAdminArea = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'))
const isManager = computed(() => {
  const role = String(auth.user?.role || '').toLowerCase()
  const roles = (auth.user?.roles || []).map(item => typeof item === 'string' ? item : item.slug)
  const permissions = auth.user?.permissions || []
  return ['admin', 'company_staff'].includes(role) || roles.some(item => !['customer', 'affiliate'].includes(item)) || permissions.some(item => item.endsWith('.manage') || item === 'dashboard.view')
})
onMounted(async () => {
  try {
    const response = await api.get('/company/brand')
    const brand = response.data?.data
    if (brand?.primaryColor && /^#[0-9a-f]{6}$/i.test(brand.primaryColor)) document.documentElement.style.setProperty('--platform-primary', brand.primaryColor)
  } catch { /* Keep the default platform accent when company settings are not configured. */ }
})
</script>

<template>
  <router-view v-if="isAuthPage" />
  <AdminLayout v-else-if="isAdminArea && isManager">
    <router-view />
  </AdminLayout>
  <AppShell v-else>
    <router-view />
  </AppShell>
</template>
