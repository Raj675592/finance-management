<template>
  <div class="profile-container flex flex-col items-center justify-center min-h-[60vh]">
    <div class="avatar mb-4">
      <img v-if="user && user.photoURL" :src="user.photoURL" alt="User Photo" class="w-32 h-32 rounded-full shadow-lg border-4 border-primary-500 object-cover" />
      <div v-else class="w-32 h-32 rounded-full bg-primary-500 flex items-center justify-center text-5xl text-white font-bold shadow-lg border-4 border-primary-500">
        <span>{{ userInitials }}</span>
      </div>
    </div>
    <div class="text-3xl font-bold mb-1">{{ user?.displayName || 'No Name' }}</div>
    <div class="text-lg text-gray-600 mb-6 flex items-center gap-2">
      <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V8a4 4 0 10-8 0v4m8 0v4a4 4 0 01-8 0v-4"/></svg>
      {{ user?.email }}
    </div>
    <div class="details-section w-full max-w-md bg-white/80 rounded-xl shadow p-6 space-y-4">
      <div class="detail-row">
        <span class="icon-label"><svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg></span>
        <span class="font-medium">User ID:</span>
        <span class="break-all text-gray-700 dark:text-gray-200">{{ user?.uid }}</span>
      </div>
      <div class="divider"></div>
      <div class="detail-row">
        <span class="icon-label"><svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 01-8 0"/></svg></span>
        <span class="font-medium">Provider:</span>
        <span class="text-gray-700 dark:text-gray-200">{{ providerId }}</span>
      </div>
      <div class="divider"></div>
      <div class="detail-row">
        <span class="icon-label"><svg class="w-5 h-5" :class="user?.emailVerified ? 'text-green-500' : 'text-red-500'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></span>
        <span class="font-medium">Email Verified:</span>
        <span class="text-gray-700 dark:text-gray-200">{{ user?.emailVerified ? 'Yes' : 'No' }}</span>
      </div>
      <div class="divider"></div>
      <div class="detail-row">
        <span class="icon-label"><svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/></svg></span>
        <span class="font-medium">Created:</span>
        <span class="text-gray-700 dark:text-gray-200">{{ creationTime }}</span>
      </div>
      <div class="divider"></div>
      <div class="detail-row">
        <span class="icon-label"><svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/></svg></span>
        <span class="font-medium">Last Sign-In:</span>
        <span class="text-gray-700 dark:text-gray-200">{{ lastSignInTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../main'

const user = ref(null)
const userInitials = ref('')
const providerId = ref('')
const creationTime = ref('')
const lastSignInTime = ref('')

onMounted(() => {
  user.value = auth.currentUser
  if (user.value && user.value.displayName) {
    userInitials.value = user.value.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  } else if (user.value && user.value.email) {
    userInitials.value = user.value.email[0].toUpperCase()
  }
  if (user.value) {
    providerId.value = user.value.providerData[0]?.providerId || 'N/A'
    creationTime.value = user.value.metadata?.creationTime || 'N/A'
    lastSignInTime.value = user.value.metadata?.lastSignInTime || 'N/A'
  }
})
</script>

<style scoped>
.profile-container {
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
  min-height: 60vh;
  padding-top: 2rem;
  padding-bottom: 2rem;
}
.avatar {
  margin-bottom: 1rem;
}
.details-section {
  margin-top: 1.5rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.04);
  padding: 2rem 1.5rem;
}
.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 1rem;
}
.icon-label {
  width: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.divider {
  border-bottom: 1px solid #e5e7eb;
  margin: 0.5rem 0;
}
.font-bold {
  letter-spacing: 0.5px;
}
.font-medium {
  letter-spacing: 0.2px;
}
</style> 