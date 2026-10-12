<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../../services/api'
const loading=ref(true), saving=ref(false), error=ref(''), success=ref('')
const roles=ref([]), permissions=ref([]), users=ref([])
const selectedRoleId=ref(''), selectedUserId=ref('')
const roleForm=ref({name:'',description:''})
const selectedPermissionIds=ref([])
const userRoleIds=ref([])
const userPermission=ref({permissionId:'',effect:'grant',reason:''})
const selectedRole=computed(()=>roles.value.find(role=>role.id===selectedRoleId.value)||null)
const groupedPermissions=computed(()=>permissions.value.reduce((groups,permission)=>{(groups[permission.module] ||= []).push(permission);return groups},{}))
async function load(){
 loading.value=true;error.value=''
 try{
  const [r,p,u]=await Promise.all([api.get('/access-control/roles'),api.get('/access-control/permissions'),api.get('/auth/admin/users')])
  roles.value=r.data?.data||[];permissions.value=p.data?.data||[];users.value=u.data?.data||[]
  if(!selectedRoleId.value&&roles.value.length)selectedRoleId.value=roles.value[0].id
  syncRolePermissions()
 }catch(e){error.value=e.response?.data?.message||'Could not load access control data.'}
 finally{loading.value=false}
}
function syncRolePermissions(){selectedPermissionIds.value=(selectedRole.value?.permissions||[]).map(p=>p.id)}
function selectRole(id){selectedRoleId.value=id;syncRolePermissions()}
async function createRole(){
 saving.value=true;error.value='';success.value=''
 try{const response=await api.post('/access-control/roles',roleForm.value);roles.value.push({...response.data.data,permissions:[]});selectedRoleId.value=response.data.data.id;syncRolePermissions();roleForm.value={name:'',description:''};success.value='Role created.'}
 catch(e){error.value=e.response?.data?.message||'Could not create role.'}finally{saving.value=false}
}
async function saveRolePermissions(){
 if(!selectedRole.value)return
 saving.value=true;error.value='';success.value=''
 try{const response=await api.put('/access-control/roles/'+selectedRole.value.id+'/permissions',{permissionIds:selectedPermissionIds.value});const updated=response.data?.data;roles.value=roles.value.map(role=>role.id===updated.id?updated:role);syncRolePermissions();success.value='Role permissions saved.'}
 catch(e){error.value=e.response?.data?.message||'Could not save role permissions.'}finally{saving.value=false}
}
async function loadUserRoles(){
 if(!selectedUserId.value){userRoleIds.value=[];return}
 try{const response=await api.get('/access-control/users/'+selectedUserId.value+'/roles');userRoleIds.value=(response.data?.data||[]).map(assignment=>assignment.roleId)}catch{userRoleIds.value=[]}
}
async function saveUserRoles(){
 if(!selectedUserId.value){error.value='Choose a user first.';return}
 saving.value=true;error.value='';success.value=''
 try{await api.put('/access-control/users/'+selectedUserId.value+'/roles',{roleIds:userRoleIds.value});success.value='User role assignments saved.'}
 catch(e){error.value=e.response?.data?.message||'Could not assign roles.'}finally{saving.value=false}
}
async function saveUserPermission(){
 if(!selectedUserId.value||!userPermission.value.permissionId){error.value='Choose a user and permission.';return}
 saving.value=true;error.value='';success.value=''
 try{await api.put('/access-control/users/'+selectedUserId.value+'/permissions',userPermission.value);success.value='User permission override saved.';userPermission.value={permissionId:'',effect:'grant',reason:''}}
 catch(e){error.value=e.response?.data?.message||'Could not save user permission.'}finally{saving.value=false}
}
onMounted(load)
</script>
<template>
 <section class="space-y-5">
  <p class="text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Roles & permissions</span></p>
  <div v-if="error" role="alert" class="border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">{{error}}</div>
  <div v-if="success" role="status" class="border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{{success}}</div>
  <div class="grid gap-5 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
   <div class="space-y-5">
    <section class="border border-slate-200 bg-white">
     <div class="border-b border-slate-200 px-4 py-3"><h2 class="text-[13px] font-bold">Roles</h2></div>
     <div v-if="loading" class="p-4 text-[12px] text-slate-500">Loading…</div>
     <div v-else class="divide-y divide-slate-100">
      <button v-for="role in roles" :key="role.id" type="button" class="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50" :class="selectedRoleId===role.id?'bg-indigo-50':''" @click="selectRole(role.id)"><span><span class="block text-[12px] font-semibold text-slate-800">{{role.name}}</span><span class="mt-0.5 block text-[10px] text-slate-500">{{role.slug}}</span></span><span class="text-[10px] text-slate-500">{{(role.permissions||[]).length}} permissions</span></button>
     </div>
    </section>
    <form class="space-y-3 border border-slate-200 bg-white p-4" @submit.prevent="createRole"><h2 class="text-[13px] font-bold">Create role</h2><input v-model="roleForm.name" required maxlength="80" class="w-full" placeholder="e.g. Returns manager"/><input v-model="roleForm.description" maxlength="255" class="w-full" placeholder="Description"/><button type="submit" :disabled="saving" class="h-9 bg-indigo-600 px-4 text-[12px] font-semibold text-white disabled:opacity-50">Create role</button></form>
   </div>
   <div class="space-y-5">
    <section class="border border-slate-200 bg-white">
     <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div><h2 class="text-[13px] font-bold">{{selectedRole?.name||'Role permissions'}}</h2><p class="mt-0.5 text-[11px] text-slate-500">Choose exactly what this role can access.</p></div><button type="button" :disabled="saving||!selectedRole" class="h-9 bg-indigo-600 px-3 text-[12px] font-semibold text-white disabled:opacity-50" @click="saveRolePermissions">Save permissions</button></div>
     <div v-if="!selectedRole" class="p-5 text-[12px] text-slate-500">Select a role.</div>
     <div v-else class="grid gap-4 p-4 sm:grid-cols-2">
      <div v-for="(items,module) in groupedPermissions" :key="module" class="border border-slate-100 p-3"><h3 class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{{module}}</h3><label v-for="permission in items" :key="permission.id" class="flex items-start gap-2 py-1.5 text-[12px] text-slate-700"><input v-model="selectedPermissionIds" type="checkbox" :value="permission.id" class="mt-0.5"/><span>{{permission.name}}<span class="block text-[10px] text-slate-400">{{permission.key}}</span></span></label></div>
     </div>
    </section>
    <section class="space-y-4 border border-slate-200 bg-white p-4">
     <div><h2 class="text-[13px] font-bold">Assign roles to a user</h2><p class="mt-1 text-[11px] text-slate-500">A user can have multiple roles. This replaces that user's current role assignments.</p></div>
     <select v-model="selectedUserId" class="w-full" @change="loadUserRoles"><option value="">Select user</option><option v-for="user in users" :key="user.id" :value="user.id">{{user.name}} · {{user.email}}</option></select>
     <div class="grid gap-2 sm:grid-cols-2"><label v-for="role in roles" :key="role.id" class="flex items-center gap-2 border border-slate-100 px-3 py-2 text-[12px]"><input v-model="userRoleIds" type="checkbox" :value="role.id"/>{{role.name}}</label></div>
     <button type="button" :disabled="saving||!selectedUserId" class="h-9 bg-indigo-600 px-4 text-[12px] font-semibold text-white disabled:opacity-50" @click="saveUserRoles">Save user roles</button>
     <div class="border-t border-slate-200 pt-4"><h3 class="text-[12px] font-bold">User-specific permission override</h3><p class="mt-1 text-[11px] text-slate-500">Grant or deny one permission in addition to assigned roles.</p></div>
     <div class="grid gap-3 sm:grid-cols-3"><select v-model="userPermission.permissionId" class="w-full"><option value="">Select permission</option><option v-for="permission in permissions" :key="permission.id" :value="permission.id">{{permission.name}}</option></select><select v-model="userPermission.effect" class="w-full"><option value="grant">Grant</option><option value="deny">Deny</option></select><input v-model="userPermission.reason" class="w-full" placeholder="Reason (optional)"/></div>
     <button type="button" :disabled="saving||!selectedUserId" class="h-9 border border-slate-300 px-4 text-[12px] font-semibold text-slate-700 disabled:opacity-50" @click="saveUserPermission">Save user override</button>
    </section>
   </div>
  </div>
 </section>
</template>