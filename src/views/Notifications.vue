<template>
  <div class="max-w-2xl w-full mx-auto py-10 px-2 sm:px-4">
    <h1 class="text-2xl font-bold mb-6">Notifications</h1>
    <div class="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h2 class="text-lg font-semibold mb-2">Notification Settings</h2>
      <div class="flex flex-col gap-2">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="settings.lowBalance" @change="saveSettings" />
          Low Balance Alerts
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="settings.recurringDue" @change="saveSettings" />
          Recurring Transaction Reminders
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="settings.goalDeadline" @change="saveSettings" />
          Goal Deadline Reminders
        </label>
      </div>
    </div>
    <div v-if="notifications.length === 0" class="text-gray-500 dark:text-gray-400 text-center">No notifications yet.</div>
    <div v-else class="flex justify-end mb-4">
      <button v-if="unreadCount > 0" @click="markAllRead" class="btn btn-sm btn-secondary">Mark All as Read</button>
    </div>
    <ul v-if="notifications.length > 0" class="space-y-4">
      <li v-for="notif in notifications" :key="notif.id" :class="[notif.read ? 'bg-gray-100' : 'bg-primary-50', 'rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm']">
        <div class="flex-1">
          <div class="font-medium" :class="notif.read ? 'text-gray-600 dark:text-gray-300' : 'text-primary-700'">{{ notif.message }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ formatDate(notif.date) }}</div>
        </div>
        <button v-if="!notif.read" @click="markRead(notif.id)" class="btn btn-sm btn-primary">Mark as read</button>
        <span v-else class="text-xs text-green-600 font-semibold">Read</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useBudgetStore } from '../stores/budget'
import { settings, saveSettings } from '../stores/notificationSettings'
import { format, parseISO } from 'date-fns'

const store = useBudgetStore()
const notifications = store.notifications
const unreadCount = computed(() => notifications.filter(n => !n.read).length)

let unsubscribe = null

onMounted(async () => {
  // No need to call loadSettings, it's called on import
  unsubscribe = await store.fetchNotifications()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

function markRead(id) {
  store.markNotificationRead(id)
}

function markAllRead() {
  notifications.filter(n => !n.read).forEach(n => store.markNotificationRead(n.id))
}

function formatDate(date) {
  return format(parseISO(date), 'MMM d, yyyy HH:mm')
}
</script> 