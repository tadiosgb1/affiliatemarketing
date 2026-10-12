<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '../../services/api'
import { auth } from '../../stores'
import AdminPagination from '../../components/admin/AdminPagination.vue'

const users=ref([]), roles=ref([]), loading=ref(true), saving=ref(false), error=ref(''), success=ref('')
const search=ref(''), roleFilter=ref('all'), savingId=ref(''), currentPage=ref(1), pageSize=ref(10), showCreate=ref(false)
const form=ref({name:'',email:'',phone:'',password:'',isAffiliate:false,roleIds:[]})
const canManageAccess=computed(()=>String(auth.user?.role||'').toLowerCase()==='admin'||(auth.user?.roles||[]).some(role=>(typeof role==='string'?role:role.slug)==='admin')||(auth.user?.permissions||[]).includes('access.manage'))
const filteredUsers=computed(()=>users.value.filter(user=>{
 const term=search.value.trim().toLowerCase()
 const assigned=(user.roles||[]).map(role=>role.slug)
 return (roleFilter.value==='all'||(roleFilter.value==='customer'&&user.role==='customer'&&!assigned.length)||(roleFilter.value==='affiliate'&&user.role==='affiliate')||assigned.includes(roleFilter.value)||user.role===roleFilter.value)&&(!term||[user.name,user.email,user.phone,user.id,...(user.roles||[]).map(role=>role.name)].some(value=>String(value||'').toLowerCase().includes(term)))
}))
const paginatedUsers=computed(()=>filteredUsers.value.slice((currentPage.value-1)*pageSize.value,currentPage.value*pageSize.value))
const activeCount=computed(()=>users.value.filter(user=>user.isActive!==false).length)
const adminCount=computed(()=>users.value.filter(user=>user.role==='admin'||(user.roles||[]).some(role=>role.slug==='admin')).length)
async function loadUsers(){
 loading.value=true;error.value=''
 try{const response=await api.get('/auth/admin/users');users.value=Array.isArray(response.data?.data)?response.data.data:[]}
 catch(err){error.value=err.response?.data?.message||'Could not load users. Check your user-management permission.'}
 finally{loading.value=false}
}
async function loadRoles(){
 if(!canManageAccess.value)return
 try{const response=await api.get('/access-control/roles');roles.value=(response.data?.data||[]).filter(role=>role.isActive!==false)}
 catch{roles.value=[]}
}
function roleLabel(user){
 const assigned=(user.roles||[]).map(role=>role.name)
 if(assigned.length)return assigned.join(', ')
 return ({admin:'Administrator',company_staff:'Company staff',affiliate:'Affiliate',customer:'Customer'})[user.role]||user.role||'Customer'
}
function shortId(id){return String(id||'').slice(0,8).toUpperCase()||'—'}
function statusClass(active){return active?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600'}
async function createUser(){
 saving.value=true;error.value='';success.value=''
 try{
  const payload={...form.value}
  if(!canManageAccess.value)payload.roleIds=[]
  const response=await api.post('/auth/admin/users',payload)
  users.value.unshift(response.data?.data)
  form.value={name:'',email:'',phone:'',password:'',isAffiliate:false,roleIds:[]}
  showCreate.value=false;success.value='User account created successfully.';currentPage.value=1
 }catch(err){error.value=err.response?.data?.message||'Could not create user account.'}
 finally{saving.value=false}
}
async function updateUser(user,changes,message){
 error.value='';success.value='';savingId.value=user.id
 try{const response=await api.patch('/auth/admin/users/'+user.id,changes);const updated=response.data?.data;if(updated)Object.assign(user,updated);success.value=message}
 catch(err){error.value=err.response?.data?.message||'Could not update this account.';await loadUsers()}
 finally{savingId.value=''}
}
function toggleActive(user){
 const active=user.isActive!==false
 if(user.id===auth.user?.id&&active){error.value='You cannot deactivate your own account.';return}
 updateUser(user,{isActive:!active},active?'Account deactivated.':'Account activated.')
}
watch([search,roleFilter],()=>{currentPage.value=1})
onMounted(()=>{loadUsers();loadRoles()})
</script>

<template>
 <section class="space-y-5">
  <p class="text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Users</span></p>
  <header class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
   <div><h1 class="text-lg font-bold text-slate-900">Users & accounts</h1></div>
   <div class="flex gap-2"><button type="button" class="h-10 rounded-lg border border-slate-200 bg-white px-3.5 text-[12px] font-semibold text-slate-700" :disabled="loading" @click="loadUsers">↻ Refresh</button><button type="button" class="h-10 rounded-lg bg-indigo-600 px-4 text-[12px] font-semibold text-white" @click="showCreate=!showCreate">{{showCreate?'Cancel':'＋ Add user'}}</button></div>
  </header>
  <div v-if="error" role="alert" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">{{error}}</div>
  <div v-if="success" role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{{success}}</div>
  <form v-if="showCreate" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createUser">
   <h2 class="mb-4 text-[14px] font-bold text-slate-900">Create account</h2>
   <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <label class="text-[12px] font-semibold text-slate-700">Full name<input v-model.trim="form.name" required minlength="2" maxlength="120" class="mt-1.5 w-full" placeholder="Full name"/></label>
    <label class="text-[12px] font-semibold text-slate-700">Email address<input v-model.trim="form.email" required type="email" class="mt-1.5 w-full" placeholder="user@example.com"/></label>
    <label class="text-[12px] font-semibold text-slate-700">Phone (optional)<input v-model.trim="form.phone" type="tel" class="mt-1.5 w-full" placeholder="Phone number"/></label>
    <label class="text-[12px] font-semibold text-slate-700">Temporary password<input v-model="form.password" required minlength="8" type="password" autocomplete="new-password" class="mt-1.5 w-full" placeholder="At least 8 characters"/></label>
    <label class="flex items-center gap-2 self-center text-[12px] font-medium text-slate-700"><input v-model="form.isAffiliate" type="checkbox"/> Enable affiliate account</label>
   </div>
   <div v-if="canManageAccess" class="mt-5 border-t border-slate-100 pt-4">
    <h3 class="text-[12px] font-bold text-slate-800">Assign roles</h3>
    <p class="mb-3 mt-1 text-[11px] text-slate-500">Choose one or more roles. Customer accounts can be left without a staff role.</p>
    <div v-if="roles.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><label v-for="role in roles" :key="role.id" class="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-[12px]"><input v-model="form.roleIds" type="checkbox" :value="role.id" class="mt-0.5"/><span class="font-medium">{{role.name}}<span v-if="role.description" class="mt-0.5 block text-[10px] font-normal text-slate-500">{{role.description}}</span></span></label></div>
    <p v-else class="text-[11px] text-slate-500">Role list unavailable. You can create a customer account; assign staff roles in Roles & permissions.</p>
   </div>
   <div class="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" class="h-9 rounded-lg border border-slate-200 px-4 text-[12px] font-semibold" @click="showCreate=false">Cancel</button><button type="submit" :disabled="saving" class="h-9 rounded-lg bg-indigo-600 px-4 text-[12px] font-semibold text-white disabled:opacity-50">{{saving?'Creating…':'Create account'}}</button></div>
  </form>
  <div class="grid gap-3 sm:grid-cols-3">
   <article class="rounded-xl border border-slate-200 bg-white p-4"><p class="text-[12px] font-medium text-slate-500">Accounts</p><p class="mt-2 text-2xl font-bold text-slate-900">{{loading?'—':users.length}}</p></article>
   <article class="rounded-xl border border-slate-200 bg-white p-4"><p class="text-[12px] font-medium text-slate-500">Active accounts</p><p class="mt-2 text-2xl font-bold text-slate-900">{{loading?'—':activeCount}}</p></article>
   <article class="rounded-xl border border-slate-200 bg-white p-4"><p class="text-[12px] font-medium text-slate-500">Administrators</p><p class="mt-2 text-2xl font-bold text-slate-900">{{loading?'—':adminCount}}</p></article>
  </div>
  <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
   <div class="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><h2 class="text-[13px] font-bold text-slate-900">Account directory</h2><div class="grid gap-2 sm:grid-cols-[minmax(200px,260px)_190px]"><input v-model="search" type="search" placeholder="Search name, email, role or ID…" aria-label="Search users"/><select v-model="roleFilter" aria-label="Filter users by role"><option value="all">All roles</option><option value="customer">Customer</option><option value="affiliate">Affiliate</option><option v-for="role in roles" :key="role.id" :value="role.slug">{{role.name}}</option></select></div></div>
   <div v-if="loading" class="p-5 text-[12px] text-slate-500">Loading accounts…</div>
   <div v-else-if="!error&&!filteredUsers.length" class="px-6 py-12 text-center text-[13px] text-slate-500">No accounts found.</div>
   <div v-else-if="filteredUsers.length" class="overflow-x-auto">
    <table class="w-full min-w-[800px] text-left text-[12px]"><thead class="bg-slate-50 text-slate-500"><tr><th class="px-4 py-3">User</th><th class="px-4 py-3">Contact</th><th class="px-4 py-3">Assigned roles</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Joined</th><th class="px-4 py-3">Action</th></tr></thead>
     <tbody><tr v-for="user in paginatedUsers" :key="user.id" class="border-t border-slate-100 hover:bg-slate-50/70">
      <td class="px-4 py-3"><p class="font-semibold text-slate-900">{{user.name||'Unnamed user'}}</p><p class="mt-0.5 font-mono text-[10px] text-slate-400">ID {{shortId(user.id)}}</p></td>
      <td class="px-4 py-3"><p>{{user.email||'—'}}</p><p class="mt-0.5 text-[11px] text-slate-400">{{user.phone||'No phone number'}}</p></td>
      <td class="max-w-[260px] whitespace-normal px-4 py-3 text-slate-600">{{roleLabel(user)}}</td>
      <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-[10px] font-semibold" :class="statusClass(user.isActive!==false)">{{user.isActive===false?'Inactive':'Active'}}</span></td>
      <td class="whitespace-nowrap px-4 py-3 text-slate-500">{{user.createdAt?new Date(user.createdAt).toLocaleDateString():'—'}}</td>
      <td class="px-4 py-3"><button type="button" :disabled="savingId===user.id||user.id===auth.user?.id" class="rounded-md border px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-40" :class="user.isActive===false?'border-emerald-200 text-emerald-700':'border-rose-200 text-rose-700'" @click="toggleActive(user)">{{savingId===user.id?'Saving…':user.isActive===false?'Activate':'Deactivate'}}</button></td>
     </tr></tbody>
    </table>
   </div>
   <AdminPagination v-if="!loading&&filteredUsers.length" v-model:page="currentPage" v-model:page-size="pageSize" :total="filteredUsers.length"/>
   <div class="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] text-slate-400">Passwords are hashed and never returned by the user-management API.</div>
  </div>
 </section>
</template>
