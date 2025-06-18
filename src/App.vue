<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav v-if="isAuthenticated" class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/dashboard" class="flex items-center">
              <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">$</span>
              </div>
              <span class="ml-2 text-xl font-bold text-gradient">Budget Planner</span>
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
              to="/settings" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100"
              :class="{ 'text-primary-600 bg-primary-50': $route.path === '/settings' }"
            >
              Settings
            </router-link>
            <button 
              @click="logout" 
              class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-danger-600 hover:bg-gray-100"
            >
              Logout
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
import { ref, onMounted } from 'vue'
import { auth } from './main'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const isAuthenticated = ref(false)
    const router = useRouter()

    const checkAuth = () => {
      auth.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user
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

    onMounted(() => {
      checkAuth()
    })

    return {
      isAuthenticated,
      logout
    }
  }
}
</script> 