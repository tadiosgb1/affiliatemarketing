<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../services/api'
import { auth } from '../../stores'

const users = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const search = ref('')
const roleFilter = ref('all')
const savingId = ref('')
const roles = [
  { value: 'customer', label: 'Customer' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'company_staff', label: 'Company staff' },
  { value: 'admin', label: 'Administrator' },
]
async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/auth/admin/users')
    users.value = Array.isArray(response.data?.data) ? response.data.data : []
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load users. Check that you are signed in with administrator access.'
  } finally {
    loading.value = false
  }
}
const filteredUsers = computed(() => users.value.filter(user => {
  const role = String(user.role || 'customer').toLowerCase()
  const term = search.value.trim().toLowerCase()
  return (roleFilter.value === 'all' || role === roleFilter.value) && (!term || [user.name, user.email, user.phone, user.id].some(value => String(value || '').toLowerCase().includes(term)))
}))
const activeCount = computed(() => users.value.filter(user => user.isActive !== false).length)
const adminCount = computed(() => users.value.filter(user => user.role === 'admin').length)
function roleLabel(role) { return roles.find(item => item.value === role)?.label || role || 'Customer' }
function shortId(id) { return String(id || '').slice(0, 8).toUpperCase() || '—' }
async function updateUser(user, changes, message) {
  error.value = ''
  success.value = ''
  savingId.value = user.id
  try {
    const response = await api.patch('/auth/admin/users/' + user.id, changes)
    const updated = response.data?.data
    if (updated) Object.assign(user, updated)
    success.value = message
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not update this account.'
    await loadUsers()
  } finally {
    savingId.value = ''
  }
}
function changeRole(user, role) {
  if (role === user.role) return
  updateUser(user, { role }, 'User role updated.')
}
function toggleActive(user) {
  const active = user.isActive !== false
  if (user.id === auth.user?.id && active) {
    error.value = 'You cannot deactivate your own administrator account.'
    return
  }
  updateUser(user, { isActive: !active }, active ? 'Account deactivated.' : 'Account activated.')
}
function statusClass(active) { return active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600' }
onMounted(loadUsers)
</script>

<template>
  <section class="space-y-5">
    <p class="mb-3 text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Users</span></p>
    <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div></div>
      <button type="button" class="h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50" :disabled="loading" @click="loadUsers">↻ Refresh users</button>
    </header>
    <div v-if="error" role="alert" class="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800"><span>{{ error }}</span><button type="button" class="font-semibold underline" @click="loadUsers">Retry</button></div>
    <div v-if="success" role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{{ success }}</div>
    <div class="grid gap-3 sm:grid-cols-3">
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Accounts</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : users.length }}</p><p class="mt-1 text-[11px] text-slate-400">Up to 500 most recent users</p></article>
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Active accounts</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : activeCount }}</p><p class="mt-1 text-[11px] text-slate-400">Accounts currently enabled</p></article>
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[12px] font-medium text-slate-500">Administrators</p><p class="mt-2 text-2xl font-bold tracking-tight text-slate-900">{{ loading ? '—' : adminCount }}</p><p class="mt-1 text-[11px] text-slate-400">Accounts with admin privileges</p></article>
    </div>
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 class="text-[13px] font-bold text-slate-900">Account directory</h3><p class="mt-1 text-[11px] text-slate-500">Role and account-state changes save immediately.</p></div><div class="grid gap-2 sm:grid-cols-[minmax(200px,260px)_170px]"><input v-model="search" type="search" aria-label="Search users" placeholder="Search name, email or ID…" class="w-full" /><select v-model="roleFilter" aria-label="Filter users by role" class="w-full"><option value="all">All roles</option><option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option></select></div></div>
      <div v-if="loading" class="space-y-3 p-5"><div v-for="n in 5" :key="n" class="h-12 animate-pulse rounded-md bg-slate-50"></div></div>
      <div v-else-if="!error && !filteredUsers.length" class="px-6 py-12 text-center"><p class="text-[13px] font-semibold text-slate-800">No accounts found</p><p class="mt-1 text-[12px] text-slate-500">Try changing your search or role filter.</p></div>
      <div v-else-if="filteredUsers.length" class="overflow-x-auto">
        <table class="w-full min-w-[880px] text-left text-[12px]">
          <thead class="bg-slate-50/80 text-slate-500"><tr><th class="px-4 py-3">User</th><th class="px-4 py-3">Contact</th><th class="px-4 py-3">Role</th><th class="px-4 py-3">Account state</th><th class="px-4 py-3">Joined</th><th class="px-4 py-3">Actions</th></tr></thead>
          <tbody><tr v-for="user in filteredUsers" :key="user.id" class="border-t border-slate-100 transition hover:bg-slate-50/70">
            <td class="px-4 py-3.5"><div class="flex items-center gap-2.5"><div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">{{ String(user.name || user.email || 'U').slice(0,1).toUpperCase() }}</div><div class="min-w-0"><p class="max-w-[200px] truncate font-semibold text-slate-900">{{ user.name || 'Unnamed user' }}</p><p class="mt-0.5 font-mono text-[10px] text-slate-400">ID {{ shortId(user.id) }}</p></div></div></td>
            <td class="px-4 py-3.5"><p class="text-slate-700">{{ user.email || '—' }}</p><p class="mt-0.5 text-[11px] text-slate-400">{{ user.phone || 'No phone number' }}</p></td>
            <td class="px-4 py-3.5"><select :value="user.role" :disabled="savingId === user.id || user.id === auth.user?.id" :aria-label="'Role for ' + user.name" class="min-h-9 w-[155px] rounded-md px-2 py-1 text-[11px]" @change="changeRole(user, $event.target.value)"><option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option></select></td>
            <td class="px-4 py-3.5"><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" :class="statusClass(user.isActive !== false)">{{ user.isActive === false ? 'Inactive' : 'Active' }}</span></td>
            <td class="whitespace-nowrap px-4 py-3.5 text-slate-500">{{ user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' }}</td>
            <td class="px-4 py-3.5"><button type="button" :disabled="savingId === user.id || user.id === auth.user?.id" class="rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40" :class="user.isActive === false ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'" @click="toggleActive(user)">{{ savingId === user.id ? 'Saving…' : user.isActive === false ? 'Activate' : 'Deactivate' }}</button></td>
          </tr></tbody>
        </table>
      </div>
      <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] text-slate-400">Passwords are never returned by the user-management API. Your own admin role and account are protected from changes here.</div>
    </div>
  </section>
</template>
