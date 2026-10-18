<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '../../services/api'
import AppDialog from '../../components/common/AppDialog.vue'

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
const draggedRuleId = ref('')
const pendingRemoveRule = ref(null)
const dialog = ref({ open: false, variant: 'info', title: '', message: '', confirmText: 'OK', cancelText: 'Cancel', showCancel: false })
const selectedCategory = computed(() => categories.value.find(c => c.id === selectedCategoryId.value))
const assignedIds = computed(() => new Set(assigned.value.map(row => row.attributeId)))

function showDialog(options) {
  dialog.value = { open: true, variant: 'info', title: 'Notice', message: '', confirmText: 'OK', cancelText: 'Cancel', showCancel: false, ...options }
}
function closeDialog() {
  if (savingRuleId.value) return
  dialog.value.open = false
  pendingRemoveRule.value = null
}
async function onDialogConfirm() {
  if (pendingRemoveRule.value) {
    const rule = pendingRemoveRule.value
    dialog.value.open = false
    pendingRemoveRule.value = null
    await removeRule(rule)
    return
  }
  closeDialog()
}
function notifySuccess(message, title = 'Saved successfully') {
  showDialog({ variant: 'success', title, message, confirmText: 'Close' })
}
function notifyError(message, title = 'Something went wrong') {
  showDialog({ variant: 'danger', title, message, confirmText: 'Close' })
}

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
    assigned.value.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  } catch (e) {
    error.value = e.response?.data?.message || 'Could not load category attribute rules.'
  }
}

async function assign() {
  if (!selectedCategoryId.value || !selectedAttributeId.value) return
  saving.value = true
  error.value = ''
  try {
    await api.post('/attributes/categories/' + selectedCategoryId.value, {
      attributeId: selectedAttributeId.value,
      isRequired: isRequired.value,
      isVariant: isVariant.value,
      sortOrder: Number(sortOrder.value) || 0,
    })
    selectedAttributeId.value = ''
    isRequired.value = false
    isVariant.value = false
    sortOrder.value = 0
    await loadAssigned()
    notifySuccess('The attribute has been assigned to this category.')
  } catch (e) {
    notifyError(e.response?.data?.message || 'Could not assign attribute.')
  } finally {
    saving.value = false
  }
}

async function saveRule(rule, changes) {
  savingRuleId.value = rule.id
  error.value = ''
  try {
    await api.patch('/attributes/categories/' + selectedCategoryId.value + '/' + rule.attributeId, changes)
    await loadAssigned()
    notifySuccess('The category attribute rule has been updated.')
  } catch (e) {
    notifyError(e.response?.data?.message || 'Could not save the category attribute rule.')
    await loadAssigned()
  } finally {
    savingRuleId.value = ''
  }
}

async function persistOrder(reordered) {
  savingRuleId.value = 'reordering'
  error.value = ''
  assigned.value = reordered
  try {
    await Promise.all(reordered.map((rule, orderIndex) => api.patch(
      '/attributes/categories/' + selectedCategoryId.value + '/' + rule.attributeId,
      { sortOrder: (orderIndex + 1) * 10 },
    )))
    await loadAssigned()
    notifySuccess('The new attribute order has been saved.')
  } catch (e) {
    await loadAssigned()
    notifyError(e.response?.data?.message || 'Could not save the new order. The saved order has been reloaded.')
  } finally {
    savingRuleId.value = ''
    draggedRuleId.value = ''
  }
}

function onDragStart(rule, event) {
  if (savingRuleId.value) {
    event.preventDefault()
    return
  }
  draggedRuleId.value = rule.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(rule.id))
}
function onDragOver(event) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}
async function onDrop(targetRule, event) {
  event.preventDefault()
  const sourceId = draggedRuleId.value || event.dataTransfer?.getData('text/plain')
  draggedRuleId.value = ''
  if (!sourceId || sourceId === targetRule.id || savingRuleId.value) return
  const fromIndex = assigned.value.findIndex(rule => String(rule.id) === String(sourceId))
  const toIndex = assigned.value.findIndex(rule => rule.id === targetRule.id)
  if (fromIndex < 0 || toIndex < 0) return
  const reordered = [...assigned.value]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  await persistOrder(reordered)
}
function onDragEnd() {
  draggedRuleId.value = ''
}

function askRemove(rule) {
  if (savingRuleId.value) return
  pendingRemoveRule.value = rule
  showDialog({
    variant: 'danger',
    title: 'Remove category assignment?',
    message: 'Remove ' + (rule.attribute?.name || 'this attribute') + ' from ' + (selectedCategory.value?.name || 'this category') + '? This removes only the category assignment. The reusable attribute and existing product data will not be deleted.',
    confirmText: 'Remove attribute',
    cancelText: 'Keep attribute',
    showCancel: true,
  })
}
async function removeRule(rule) {
  savingRuleId.value = rule.id
  error.value = ''
  try {
    await api.delete('/attributes/categories/' + selectedCategoryId.value + '/' + rule.attributeId)
    await loadAssigned()
    notifySuccess('The attribute has been removed from this category. The attribute itself and existing product data were kept.')
  } catch (e) {
    notifyError(e.response?.data?.message || 'Could not remove the attribute from this category.')
  } finally {
    savingRuleId.value = ''
  }
}

watch(selectedCategoryId, async () => {
  error.value = ''
  await loadAssigned()
})
onMounted(loadBase)
</script>

<template>
  <section class="space-y-5">
    <header class="border-b border-slate-200 pb-4">
      <p class="text-xs text-slate-500">Catalog / Category attributes</p>
      <h1 class="mt-1 text-xl font-bold">Category attribute rules</h1>
      <p class="mt-1 text-sm text-slate-500">Assign reusable attributes to any category, drag fields to change their order, and remove assignments without deleting reusable attributes.</p>
    </header>

    <p v-if="error" role="alert" class="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
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
          <p class="mt-1 text-sm text-slate-500">Press and hold the drag handle, move the row up or down, and release to save the order. Required and variant settings can be changed inline. Removing a rule does not delete the attribute itself or existing product values.</p>
        </div>
        <div v-if="!assigned.length" class="p-5 text-sm text-slate-500">No attributes assigned to this category yet.</div>
        <div
          v-for="(rule, index) in assigned"
          :key="rule.id"
          class="border-b border-slate-100 p-4 transition-colors last:border-0"
          :class="draggedRuleId === rule.id ? 'bg-indigo-50 opacity-60' : 'bg-white'"
          @dragover="onDragOver"
          @drop="onDrop(rule, $event)"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                draggable="true"
                :disabled="!!savingRuleId"
                class="mt-0.5 cursor-grab touch-none rounded border border-slate-200 px-2 py-1 text-slate-500 hover:bg-slate-100 active:cursor-grabbing disabled:cursor-not-allowed"
                :aria-label="'Drag to reorder ' + (rule.attribute?.name || 'attribute')"
                title="Drag to reorder"
                @dragstart="onDragStart(rule, $event)"
                @dragend="onDragEnd"
              >⠿</button>
              <div class="min-w-0 flex-1">
                <p class="font-semibold">{{ rule.attribute?.name || 'Attribute' }}</p>
                <p class="mt-1 break-words text-xs text-slate-500">{{ rule.attribute?.type }} · {{ (rule.attribute?.values || []).map(value => value.label || value.value).join(', ') || 'No selectable values' }}</p>
                <div class="mt-3 flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="rule.isRequired" :disabled="!!savingRuleId" @change="saveRule(rule, { isRequired: $event.target.checked })" /> Required</label>
                  <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="rule.isVariant" :disabled="!!savingRuleId" @change="saveRule(rule, { isVariant: $event.target.checked })" /> Variant option</label>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded bg-slate-100 px-2 py-1 text-xs">Order {{ rule.sortOrder }}</span>
              <button type="button" :disabled="!!savingRuleId" class="rounded border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40" @click="askRemove(rule)">{{ savingRuleId === rule.id ? 'Saving…' : 'Remove' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppDialog
      :open="dialog.open"
      :variant="dialog.variant"
      :title="dialog.title"
      :message="dialog.message"
      :confirm-text="dialog.confirmText"
      :cancel-text="dialog.cancelText"
      :show-cancel="dialog.showCancel"
      :busy="!!savingRuleId && !!pendingRemoveRule"
      @confirm="onDialogConfirm"
      @cancel="closeDialog"
      @close="closeDialog"
    />
  </section>
</template>
