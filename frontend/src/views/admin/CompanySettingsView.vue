<script setup>
import { onMounted, ref } from 'vue'
import api from '../../services/api'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const configured = ref(false)
const form = ref({
  name: '', legalName: '', registrationNumber: '', taxNumber: '', businessType: 'company',
  email: '', phone: '', country: 'Ethiopia', city: '', address: '', logoUrl: '', status: 'active',
})
const fields = [
  { key: 'name', label: 'Trading name', required: true },
  { key: 'legalName', label: 'Legal name' },
  { key: 'registrationNumber', label: 'Registration number' },
  { key: 'taxNumber', label: 'Tax number' },
  { key: 'email', label: 'Business email', type: 'email' },
  { key: 'phone', label: 'Business phone' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Business address', type: 'textarea' },
  { key: 'logoUrl', label: 'Logo URL' },
]
async function loadCompany() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/company')
    const company = response.data?.data
    if (company) {
      configured.value = true
      Object.keys(form.value).forEach(key => {
        if (company[key] !== undefined && company[key] !== null) form.value[key] = company[key]
      })
    }
  } catch (err) {
    if (err.response?.status === 404) configured.value = false
    else error.value = err.response?.data?.message || 'Could not load company settings.'
  } finally {
    loading.value = false
  }
}
async function saveCompany() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const payload = { ...form.value }
    if (configured.value) await api.patch('/company', payload)
    else await api.post('/company', payload)
    configured.value = true
    success.value = 'Company profile saved successfully.'
    await loadCompany()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not save company settings. Check required fields and administrator access.'
  } finally {
    saving.value = false
  }
}
onMounted(loadCompany)
</script>

<template>
  <section class="space-y-5">
    <p class="mb-3 text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Company profile</span></p>
    <header class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><h2 class="text-sm font-semibold text-slate-800">Company profile</h2></div>
      <span class="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold" :class="configured ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'"><span class="h-1.5 w-1.5 rounded-full" :class="configured ? 'bg-emerald-500' : 'bg-amber-500'"></span>{{ configured ? 'Profile configured' : 'Setup required' }}</span>
    </header>
    <div v-if="error" role="alert" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">{{ error }}</div>
    <div v-if="success" role="status" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{{ success }}</div>
    <div v-if="loading" class="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"></div>
    <form v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" @submit.prevent="saveCompany">
      <div class="border-b border-slate-100 px-5 py-4"><h3 class="text-[14px] font-bold text-slate-900">Business information</h3><p class="mt-1 text-[12px] text-slate-500">Fields marked required must be completed.</p></div>
      <div class="grid gap-x-5 gap-y-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="field in fields" :key="field.key" :class="field.type === 'textarea' ? 'sm:col-span-2 xl:col-span-3' : ''">
          <label :for="'company-' + field.key" class="mb-1.5 block text-[12px] font-semibold text-slate-700">{{ field.label }}<span v-if="field.required" class="ml-1 text-rose-500">*</span></label>
          <textarea v-if="field.type === 'textarea'" :id="'company-' + field.key" v-model="form[field.key]" :required="field.required" rows="3"></textarea>
          <input v-else :id="'company-' + field.key" v-model="form[field.key]" :type="field.type || 'text'" :required="field.required" class="w-full" />
        </div>
        <div><label for="company-business-type" class="mb-1.5 block text-[12px] font-semibold text-slate-700">Business type</label><select id="company-business-type" v-model="form.businessType" class="w-full"><option value="company">Company</option><option value="partnership">Partnership</option><option value="individual">Individual</option></select></div>
        <div><label for="company-status" class="mb-1.5 block text-[12px] font-semibold text-slate-700">Account status</label><select id="company-status" v-model="form.status" class="w-full"><option value="active">Active</option><option value="suspended">Suspended</option></select><p class="mt-1.5 text-[11px] text-slate-400">Suspending a company may affect store operations.</p></div>
      </div>
      <div class="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p class="text-[11px] text-slate-400">Only administrator accounts can create or update this profile.</p><button type="submit" :disabled="saving" class="h-10 rounded-lg bg-indigo-600 px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">{{ saving ? 'Saving profile…' : configured ? 'Save changes' : 'Create company profile' }}</button></div>
    </form>
  </section>
</template>
