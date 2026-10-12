<script setup>
import { onMounted, ref } from 'vue'
import api from '../../services/api'

const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = ref({ name: '', description: '', parentId: '' })
const showForm = ref(false)

async function loadCategories() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/categories')
    categories.value = response.data?.data ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load categories. Please check your API connection and sign-in permissions.'
  } finally {
    loading.value = false
  }
}

async function createCategory() {
  const name = form.value.name.trim()
  if (!name) {
    error.value = 'Enter a category name.'
    return
  }

  saving.value = true
  error.value = ''
  success.value = ''
  try {
    const response = await api.post('/categories', {
      name,
      description: form.value.description.trim() || undefined,
      parentId: form.value.parentId || undefined,
    })
    const created = response.data?.data
    if (created) categories.value.push(created)
    form.value = { name: '', description: '', parentId: '' }
    success.value = 'Category created successfully.'
    showForm.value = false
    if (!created) await loadCategories()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not create category. Make sure you are signed in with management access.'
  } finally {
    saving.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <section class="space-y-6">
    <p class="mb-3 text-[12px] text-slate-500">Home / <span class="font-semibold text-slate-700">Categories</span></p>
    <header class="flex items-center justify-between border-b border-slate-200 pb-3">
      <h1 class="text-sm font-semibold text-slate-800">Categories</h1>
      <button type="button" class="h-9 bg-indigo-600 px-3.5 text-[12px] font-semibold text-white hover:bg-indigo-700" @click="showForm = !showForm">{{ showForm ? 'Cancel' : '+ Add category' }}</button>
    </header>

    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </p>
    <p v-if="success" role="status" class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
      {{ success }}
    </p>

    <form v-if="showForm" class="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-2" @submit.prevent="createCategory">
      <div>
        <label for="category-name" class="mb-1 block text-sm font-semibold">Category name</label>
        <input
          id="category-name"
          v-model="form.name"
          required
          maxlength="120"
          class="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500"
          placeholder="e.g. Electronics"
        />
      </div>
      <div>
        <label for="category-parent" class="mb-1 block text-sm font-semibold">Parent category (optional)</label>
        <select id="category-parent" v-model="form.parentId" class="w-full rounded-xl border bg-white px-3 py-2.5 outline-none focus:border-indigo-500">
          <option value="">Top-level category</option>
          <option v-for="parent in categories.filter(category => !category.parentId)" :key="parent.id" :value="parent.id">{{ parent.name }}</option>
        </select>
        <p class="mt-1 text-xs text-slate-500">Choose a parent to create a subcategory.</p>
      </div>
      <div>
        <label for="category-description" class="mb-1 block text-sm font-semibold">Description (optional)</label>
        <input
          id="category-description"
          v-model="form.description"
          class="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-indigo-500"
          placeholder="What belongs in this category?"
        />
      </div>
      <div class="md:col-span-2">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-xl bg-slate-950 px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ saving ? 'Creating…' : 'Create category' }}
        </button>
      </div>
    </form>

    <div class="overflow-hidden border border-slate-200 bg-white">
      <div class="flex items-center justify-between border-b p-4">
        <h2 class="font-bold">All categories</h2>
        <button type="button" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800" @click="loadCategories">
          Refresh
        </button>
      </div>

      <p v-if="loading" class="p-6 text-sm text-slate-500">Loading categories…</p>
      <p v-else-if="categories.length === 0 && !error" class="p-6 text-sm text-slate-500">
        No categories yet. Create the first one above.
      </p>
      <div v-else-if="categories.length" class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-4 py-3 font-semibold">Category</th>
              <th class="p-4 font-semibold">Description</th>
              <th class="p-4 font-semibold">Slug</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id" class="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
              <td class="p-4 font-semibold"><span v-if="category.parentId" class="mr-2 text-slate-400">↳</span>{{ category.name }}<span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{{ category.parentId ? "Subcategory" : "Main category" }}</span></td>
              <td class="px-4 py-3 text-slate-600">{{ category.description || '—' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ category.slug || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
