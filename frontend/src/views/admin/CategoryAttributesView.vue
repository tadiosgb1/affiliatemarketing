<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '../../services/api'

const categories = ref([])
const attributes = ref([])
const selectedCategoryId = ref('')
const assigned = ref([])
const selectedAttributeId = ref('')
const isRequired = ref(false)
const isVariant = ref(false)
const sortOrder = ref(0)
const loading = ref(false)
const saving = ref(false)
const savingRuleId = ref('')
const error = ref('')
const success = ref('')
const selectedCategory = computed(() => categories.value.find(c => c.id === selectedCategoryId.value))
const assignedIds = computed(() => new Set(assigned.value.map(row => row.attributeId)))

async function loadBase() {
  loading.value = true
  error.value = ''
  try {
    const [categoryResponse, attributeResponse] = await Promise.all([
      api.get('/categories'),
      api.get('/attributes'),
    ])
    categories.value = categoryResponse.data?.data || []
    attributes.value = attributeResponse.data?.data || []
    if (!selectedCategoryId.value && categories.value.length) selectedCategoryId.value = categories.value[0].id
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not load categories and attributes.'
  } finally {
    loading.value = false
  }
}

async function loadAssigned() {
  if (!selectedCategoryId.value) {
    assigned.value = []
    return
  }
  try {
    const response = await api.get('/attributes/categories/' + selectedCategoryId.value)
    assigned.value = Array.isArray(response.data?.data) ? response.data.data : []
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not load category attribute rules.'
  }
}

async function assign() {
  if (!selectedCategoryId.value || !selectedAttributeId.value) return
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await api.post('/attributes/categories/' + selectedCategoryId.value, {
      attributeId: selectedAttributeId.value,
      isRequired: isRequired.value,
      isVariant: isVariant.value,
      sortOrder: Number(sortOrder.value) || 0,
    })
    success.value = 'Attribute assigned to category.'
    selectedAttributeId.value = ''
    isRequired.value = false
    isVariant.value = false
    sortOrder.value = 0
    await loadAssigned()
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not assign attribute.'
  } finally {
    saving.value = false
  }
}

async function saveRule(rule, changes) {
  savingRuleId.value = rule.id
  error.value = ''
  success.value = ''
  try {
    await api.patch('/attributes/categories/' + selectedCategoryId.value + '/' + rule.attributeId, changes)
    success.value = 'Category attribute rule saved.'
    await loadAssigned()
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not save the category attribute rule.'
    await loadAssigned()
  } finally {
    savingRuleId.value = ''
  }
}

async function moveRule(index, offset) {
  const targetIndex = index + offset
  if (targetIndex < 0 || targetIndex >= assigned.value.length || savingRuleId.value) return
  const reordered = [...assigned.value]
  ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
  assigned.value = reordered
  savingRuleId.value = 'reordering'
  error.value = ''
  success.value = ''
  try {
    await Promise.all(reordered.map((rule, orderIndex) => api.patch(
      '/attributes/categories/' + selectedCategoryId.value + '/' + rule.attributeId,
      { sortOrder: (orderIndex + 1) * 10 },
    )))
    success.value = 'Attribute display order saved.'
    await loadAssigned()
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not save the new order. The saved order has been reloaded.'
    await loadAssigned()
  } finally {
    savingRuleId.value = ''
  }
}

async function removeRule(rule) {
  if (savingRuleId.value) return
  const name = rule.attribute?.name || 'this attribute'
  if (!window.confirm('Remove ' + name + ' from ' + (selectedCategory.value?.name || 'this category') + '? This removes only the category assignment, not the reusable attribute or its existing product data.')) return
  savingRuleId.value = rule.id
  error.value = ''
  success.value = ''
  try {
    await api.delete('/attributes/categories/' + selectedCategoryId.value + '/' + rule.attributeId)
    success.value = 'Attribute removed from this category.'
    await loadAssigned()
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not remove the attribute from this category.'
  } finally {
    savingRuleId.value = ''
  }
}

watch(selectedCategoryId, async () => {
  error.value = ''
  success.value = ''
  await loadAssigned()
})
onMounted(loadBase)
</script>

<template>
  <section class="space-y-5">
    <header class="border-b border-slate-200 pb-4">
      <p class="text-xs text-slate-500">Catalog / Category attributes</p>
      <h1 class="mt-1 text-xl font-bold">Category attribute rules</h1>
      <p class="mt-1 text-sm text-slate-500">Assign reusable attributes to any category, remove assignments, and control the order in which fields appear on product forms.</p>
    </header>

    <p v-if="error" role="alert" class="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    <p v-if="success" role="status" class="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{{ success }}</p>
    <div v-if="loading" class="border bg-white p-5 text-sm text-slate-500">Loading catalog settings…</div>

    <div v-else class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <div class="space-y-4 border border-slate-200 bg-white p-5">
        <h2 class="font-bold">Assign an attribute</h2>
        <label class="block text-sm font-semibold">Category
          <select v-model="selectedCategoryId" class="mt-1 w-full rounded border bg-white p-2.5">
            <option value="" disabled>Select category</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.parentId ? '— ' : '' }}{{ category.name }}</option>
          </select>
        </label>
        <label class="block text-sm font-semibold">Attribute
          <select v-model="selectedAttributeId" class="mt-1 w-full rounded border bg-white p-2.5">
            <option value="" disabled>Select attribute</option>
            <option v-for="attribute in attributes.filter(item => !assignedIds.has(item.id))" :key="attribute.id" :value="attribute.id">{{ attribute.name }} · {{ attribute.type }}</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-sm"><input v-model="isRequired" type="checkbox" /> Required for this category</label>
        <label class="flex items-center gap-2 text-sm"><input v-model="isVariant" type="checkbox" /> Use as a variant option (e.g. size or color)</label>
        <label class="block text-sm font-semibold">Initial display order
          <input v-model.number="sortOrder" type="number" min="0" class="mt-1 w-full rounded border p-2.5" />
        </label>
        <button :disabled="saving || !selectedCategoryId || !selectedAttributeId" class="bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" @click="assign">{{ saving ? 'Saving…' : 'Assign attribute' }}</button>
        <p v-if="!categories.length" class="text-sm text-amber-700">Create a category first.</p>
        <p v-if="!attributes.length" class="text-sm text-amber-700">Create attributes first.</p>
      </div>

      <div class="border border-slate-200 bg-white">
        <div class="border-b border-slate-200 p-5">
          <h2 class="font-bold">Attributes assigned to {{ selectedCategory?.name || 'category' }}</h2>
          <p class="mt-1 text-sm text-slate-500">Use the up/down controls to reorder fields. Removing a rule does not delete the attribute itself or existing product values.</p>
        </div>
        <div v-if="!assigned.length" class="p-5 text-sm text-slate-500">No attributes assigned to this category yet.</div>
        <div v-for="(rule, index) in assigned" :key="rule.id" class="border-b border-slate-100 p-4 last:border-0">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="font-semibold">{{ rule.attribute?.name || 'Attribute' }}</p>
              <p class="mt-1 break-words text-xs text-slate-500">{{ rule.attribute?.type }} · {{ (rule.attribute?.values || []).map(value => value.label || value.value).join(', ') || 'No selectable values' }}</p>
              <div class="mt-3 flex flex-wrap gap-4">
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="rule.isRequired" :disabled="!!savingRuleId" @change="saveRule(rule, { isRequired: $event.target.checked })" /> Required</label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="rule.isVariant" :disabled="!!savingRuleId" @change="saveRule(rule, { isVariant: $event.target.checked })" /> Variant option</label>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded bg-slate-100 px-2 py-1 text-xs">Order {{ rule.sortOrder }}</span>
              <button type="button" :disabled="index === 0 || !!savingRuleId" class="rounded border px-3 py-1.5 text-sm disabled:opacity-40" :aria-label="'Move ' + (rule.attribute?.name || 'attribute') + ' up'" title="Move up" @click="moveRule(index, -1)">↑</button>
              <button type="button" :disabled="index === assigned.length - 1 || !!savingRuleId" class="rounded border px-3 py-1.5 text-sm disabled:opacity-40" :aria-label="'Move ' + (rule.attribute?.name || 'attribute') + ' down'" title="Move down" @click="moveRule(index, 1)">↓</button>
              <button type="button" :disabled="!!savingRuleId" class="rounded border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40" @click="removeRule(rule)">{{ savingRuleId === rule.id ? 'Saving…' : 'Remove' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
