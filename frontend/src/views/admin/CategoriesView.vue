<script setup>
import { onMounted, ref } from 'vue'
import api from '../../services/api'

const categories = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = ref({ name: '', description: '' })

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
    })
    const created = response.data?.data
    if (created) categories.value.push(created)
    form.value = { name: '', description: '' }
    success.value = 'Category created successfully.'
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
    <header>
      <p class="text-sm font-bold uppercase tracking-wider text-indigo-600">Catalog</p>
      <h1 class="mt-1 text-3xl font-black">Categories</h1>
      <p class="mt-2 text-slate-500">Organize products into clear, browsable groups.</p>
    </header>

    <p v-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </p>
    <p v-if="success" role="status" class="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
      {{ success }}
    </p>

    <form class="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2" @submit.prevent="createCategory">
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

    <div class="overflow-hidden rounded-2xl border bg-white">
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
              <th class="p-4 font-semibold">Name</th>
              <th class="p-4 font-semibold">Description</th>
              <th class="p-4 font-semibold">Slug</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id" class="border-t">
              <td class="p-4 font-semibold">{{ category.name }}</td>
              <td class="p-4 text-slate-600">{{ category.description || '—' }}</td>
              <td class="p-4 text-slate-500">{{ category.slug || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
