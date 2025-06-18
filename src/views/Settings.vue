<template>
    <div class="card">
      <div class="font-semibold mb-4">Manage Categories</div>
      <div class="mb-4">
        <button @click="showAddModal = true" class="btn btn-primary">+ Add Category</button>
      </div>
      <div v-if="categories.length === 0" class="text-gray-500">No categories.</div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="cat in categories" :key="cat.id" class="py-2 flex items-center justify-between">
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
      <div v-if="showAddModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div class="font-semibold mb-4">{{ showEditModal ? 'Edit Category' : 'Add Category' }}</div>
          <form @submit.prevent="showEditModal ? updateCategory() : addCategory()">
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
  
  onMounted(() => {
    store.fetchCategories()
  })
  
  async function addCategory() {
    await store.addCategory({ ...form.value })
    closeModal()
  }
  function openEditCategory(cat) {
    form.value = { name: cat.name, icon: cat.icon, color: cat.color }
    editId.value = cat.id
    showEditModal.value = true
  }
  async function updateCategory() {
    await store.updateCategory(editId.value, { ...form.value })
    closeModal()
  }
  async function deleteCategory(id) {
    if (confirm('Delete this category?')) {
      await store.deleteCategory(id)
    }
  }
  function closeModal() {
    showAddModal.value = false
    showEditModal.value = false
    editId.value = null
    form.value = { name: '', icon: '', color: '#3b82f6' }
  }
  </script>
  