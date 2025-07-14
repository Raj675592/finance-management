import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import components
import Dashboard from './views/Dashboard.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Settings from './views/Settings.vue'
import MyProfile from './views/MyProfile.vue'
import Notifications from './views/Notifications.vue'
import Reports from './views/Reports.vue'

// Import Firebase configuration
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserSessionPersistence, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCtdfkl-2ApSGqXubtsG6n94HHCKxb9SZA",
    authDomain: "finance-management-4ceb0.firebaseapp.com",
    projectId: "finance-management-4ceb0",
    storageBucket: "finance-management-4ceb0.firebasestorage.app",
    messagingSenderId: "514451045610",
    appId: "1:514451045610:web:df1f5cc06955b3685bab93",
    measurementId: "G-EV8F1RCHD6"
  }
  

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)
setPersistence(auth, browserSessionPersistence)
  .catch((error) => {
    console.error('Failed to set auth persistence:', error)
  })
const db = getFirestore(firebaseApp)

// Export for use in components
export { auth, db }

// Router configuration
const routes = [
  { path: '/', redirect: (to) => {
      const isAuthenticated = auth.currentUser;
      return isAuthenticated ? '/dashboard' : '/login';
    }
  },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/profile', component: MyProfile, meta: { requiresAuth: true } },
  { path: '/notifications', component: Notifications, meta: { requiresAuth: true } },
  { path: '/reports', component: Reports, meta: { requiresAuth: true } },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/settings', component: Settings, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = auth.currentUser

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

const app = createApp(App)
const pinia = createPinia()

// Wait for Firebase Auth to initialize before mounting the app
onAuthStateChanged(auth, () => {
  app.use(pinia)
  app.use(router)
  app.mount('#app')
}) 