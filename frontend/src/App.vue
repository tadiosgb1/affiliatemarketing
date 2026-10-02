<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from './components/layout/AppShell.vue'
const route = useRoute()
const authPages = computed(() => ['/login','/register'].includes(route.path))
</script>
<template>
  <div v-if="authPages"><router-view /></div>
  <AppShell v-else><router-view /></AppShell>
</template>