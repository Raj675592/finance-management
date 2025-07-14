<template>
    <div class="card w-full max-w-2xl mx-auto">
      <div class="font-semibold mb-4">Manage Categories</div>
      <div class="mb-4">
        <button @click="showAddModal = true" class="btn btn-primary">+ Add Category</button>
      </div>
      <div v-if="categories.length === 0" class="text-gray-500 dark:text-gray-400">No categories.</div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="cat in categories" :key="cat.id" class="py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-2xl">{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </div>
          <div class="flex space-x-2">
            <button @click="openEditCategory(cat)" class="btn btn-secondary btn-sm px-2 py-1 text-xs">Edit</button>
            <button @click="deleteCategory(cat.id)" class="btn btn-danger btn-sm px-2 py-1 text-xs">Delete</button>
          </div>
        </li>
      </ul>
  
      <!-- Add/Edit Category Modal -->
      <div v-if="showAddModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-2">
        <div class="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
          <div class="font-semibold mb-4">{{ showEditModal ? 'Edit Category' : 'Add Category' }}</div>
          <form @submit.prevent="showEditModal ? updateCategory() : addCategory()">
            <div v-if="error && !showEditModal" class="mb-2 text-danger-600">{{ error }}</div>
            <div v-if="updateError && showEditModal" class="mb-2 text-danger-600">{{ updateError }}</div>
            <div class="form-group">
              <label class="form-label">Name</label>
              <input v-model="form.name" type="text" class="input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Icon (emoji)</label>
              <input v-model="form.icon" type="text" class="input" maxlength="2" required />
            </div>
            <div class="form-group">
              <label class="form-label">Color (hex)</label>
              <input v-model="form.color" type="color" class="input" required />
            </div>
            <div class="flex justify-end space-x-2 mt-4">
              <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ showEditModal ? 'Update' : 'Add' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-if="deleteError" class="text-danger-600 mt-2">{{ deleteError }}</div>
    <div class="card mb-8 w-full max-w-2xl mx-auto">
      <div class="font-semibold mb-4">Budget Limits</div>
      <div v-for="cat in categories" :key="cat.id" class="flex items-center gap-2 mb-2">
        <span class="text-2xl">{{ cat.icon }}</span>
        <span class="w-32">{{ cat.name }}</span>
        <input type="number" min="0" class="input w-28" v-model.number="limits[cat.id]" @change="saveLimits" placeholder="No limit" />
        <span class="text-gray-400">{{ currencyFormat(limits[cat.id] || 0) }}</span>
      </div>
    </div>
    <div class="card mb-8 w-full max-w-2xl mx-auto">
      <div class="font-semibold mb-4">Preferences</div>
      <div class="form-group">
        <label class="form-label">Preferred Currency</label>
        <select v-model="currency" @change="saveCurrency" class="input">
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="JPY">JPY (¥)</option>
          <option value="CNY">CNY (¥)</option>
          <option value="AUD">AUD (A$)</option>
          <option value="CAD">CAD (C$)</option>
          <option value="SGD">SGD (S$)</option>
          <option value="ZAR">ZAR (R)</option>
        </select>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useBudgetStore } from '../stores/budget'
  
  const store = useBudgetStore()
  const categories = store.categories
  
  const showAddModal = ref(false)
  const showEditModal = ref(false)
  const editId = ref(null)
  const form = ref({ name: '', icon: '', color: '#3b82f6' })
  const error = ref('') // Error for category modal
  const updateError = ref('') // Error for updating category
  const deleteError = ref('') // Error for deleting category
  const currency = ref(localStorage.getItem('currency') || 'INR')
  const limits = ref(JSON.parse(localStorage.getItem('budgetLimits') || '{}'))

  onMounted(() => {
    store.fetchCategories()
  })
  
  async function addCategory() {
    error.value = ''
    try {
      await store.addCategory({ ...form.value })
      closeModal()
    } catch (err) {
      error.value = err.message || 'Failed to add category. Please try again.'
    }
  }
  function openEditCategory(cat) {
    form.value = { name: cat.name, icon: cat.icon, color: cat.color }
    editId.value = cat.id
    showEditModal.value = true
  }
  async function updateCategory() {
    updateError.value = ''
    try {
      await store.updateCategory(editId.value, { ...form.value })
      closeModal()
    } catch (err) {
      updateError.value = err.message || 'Failed to update category. Please try again.'
    }
  }
  async function deleteCategory(id) {
    deleteError.value = ''
    if (confirm('Delete this category?')) {
      try {
        await store.deleteCategory(id)
      } catch (err) {
        deleteError.value = err.message || 'Failed to delete category. Please try again.'
        alert(deleteError.value)
      }
    }
  }
  function closeModal() {
    showAddModal.value = false
    showEditModal.value = false
    editId.value = null
    form.value = { name: '', icon: '', color: '#3b82f6' }
    error.value = ''
    updateError.value = ''
    deleteError.value = ''
  }

  function saveCurrency() {
    localStorage.setItem('currency', currency.value)
  }

  function saveLimits() {
    localStorage.setItem('budgetLimits', JSON.stringify(limits.value))
  }
  function currencyFormat(val) {
    const code = localStorage.getItem('currency') || 'INR'
    return Number(val).toLocaleString(undefined, { style: 'currency', currency: code })
  }
  </script>
  