<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from './stores'
import AppShell from './components/layout/AppShell.vue'
import AdminLayout from './components/layout/AdminLayout.vue'

const route = useRoute()
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const isAdminArea = computed(() => route.path === '/admin' || route.path.startsWith('/admin/'))
const isManager = computed(() => ['admin', 'company_staff'].includes(String(auth.user?.role || '').toLowerCase()))
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
