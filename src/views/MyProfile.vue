<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh]">
    <h1 class="text-2xl font-bold mb-6">My Profile</h1>
    <UserProfile />
    <button @click="showEdit = true" class="btn btn-primary mt-6">Edit Profile</button>
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-2">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div class="font-semibold mb-4">Edit Profile</div>
        <form @submit.prevent="saveProfile">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input v-model="editName" type="text" class="input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Photo URL</label>
            <input v-model="editPhoto" type="url" class="input" />
          </div>
          <div v-if="error" class="text-danger-600 mb-2">{{ error }}</div>
          <div class="flex justify-end gap-2 mt-4">
            <button type="button" @click="showEdit = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import UserProfile from '../components/UserProfile.vue'
import { auth } from '../main'
import { updateProfile } from 'firebase/auth'

const showEdit = ref(false)
const error = ref('')
const user = auth.currentUser
const editName = ref(user?.displayName || '')
const editPhoto = ref(user?.photoURL || '')

async function saveProfile() {
  error.value = ''
  try {
    await updateProfile(user, {
      displayName: editName.value,
      photoURL: editPhoto.value
    })
    showEdit.value = false
    window.location.reload()
  } catch (err) {
    error.value = err.message || 'Failed to update profile.'
  }
}
</script> 