<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav v-if="isAuthenticated" class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/dashboard" class="flex items-center">
              <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">₹</span>
              </div>
              <span class="ml-2 text-xl font-bold text-gradient">PlanPaisa</span>
            </router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <router-link 
              to="/dashboard" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              :class="{ 'text-primary-600 bg-primary-50': $route.path === '/dashboard' }"
            >
              Dashboard
            </router-link>
            <router-link 
              to="/profile" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              :class="{ 'text-primary-600 bg-primary-50': $route.path === '/profile' }"
            >
              My Profile
            </router-link>
            <router-link 
              to="/settings" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              :class="{ 'text-primary-600 bg-primary-50': $route.path === '/settings' }"
            >
              Settings
            </router-link>
            <router-link 
              to="/reports" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              :class="{ 'text-primary-600 bg-primary-50': $route.path === '/reports' }"
            >
              Reports
            </router-link>
            <router-link 
              to="/notifications" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 relative"
              :class="{ 'text-primary-600 bg-primary-50': $route.path === '/notifications' }"
            >
              Notifications
              <span v-if="unreadCount > 0" class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{{ unreadCount }}</span>
            </router-link>
            <button 
              @click="logout" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-danger-600 hover:bg-gray-100"
            >
              Logout
            </button>
            <button @click="toggleDark" class="ml-2 px-3 py-2 rounded-md text-sm font-medium" :class="isDark ? 'bg-gray-800 text-yellow-300' : 'bg-gray-200 text-gray-700'">
              <span v-if="isDark">🌙 Dark</span>
              <span v-else>☀️ Light</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { auth } from './main'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { useBudgetStore } from './stores/budget'

export default {
  name: 'App',
  setup() {
    const isAuthenticated = ref(false)
    const router = useRouter()
    const store = useBudgetStore()
    const unreadCount = computed(() => store.notifications.filter(n => !n.read).length)
    const isDark = ref(localStorage.getItem('theme') === 'dark')

    const checkAuth = () => {
      auth.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user
        if (user) store.fetchNotifications()
      })
    }

    const logout = async () => {
      try {
        await signOut(auth)
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    function toggleDark() {
      isDark.value = !isDark.value
      document.documentElement.classList.toggle('dark', isDark.value)
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    onMounted(() => {
      checkAuth()
      document.documentElement.classList.toggle('dark', isDark.value)
    })

    return {
      isAuthenticated,
      logout,
      unreadCount,
      isDark,
      toggleDark
    }
  }
}
</script> 