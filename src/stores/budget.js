import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '../main'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot 
} from 'firebase/firestore'

export const useBudgetStore = defineStore('budget', () => {
  // State
  const transactions = ref([])
  const goals = ref([])
  const categories = ref([])
  const notifications = ref([])

  // Default categories (used for new users)
  const defaultCategories = [
    { id: 'income', name: 'Income', color: '#22c55e', icon: '💰' },
    { id: 'food', name: 'Food & Dining', color: '#f59e0b', icon: '🍽️' },
    { id: 'transport', name: 'Transportation', color: '#3b82f6', icon: '🚗' },
    { id: 'entertainment', name: 'Entertainment', color: '#8b5cf6', icon: '🎬' },
    { id: 'shopping', name: 'Shopping', color: '#ec4899', icon: '🛍️' },
    { id: 'health', name: 'Healthcare', color: '#ef4444', icon: '🏥' },
    { id: 'utilities', name: 'Utilities', color: '#10b981', icon: '⚡' },
    { id: 'housing', name: 'Housing', color: '#6366f1', icon: '🏠' },
    { id: 'education', name: 'Education', color: '#06b6d4', icon: '📚' },
    { id: 'other', name: 'Other', color: '#6b7280', icon: '📦' }
  ]

  // Getters
  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const totalExpenses = computed(() => {
    return transactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const balance = computed(() => totalIncome.value - totalExpenses.value)

  const expensesByCategory = computed(() => {
    const expenses = transactions.value.filter(t => t.type === 'expense')
    const grouped = {}
    
    categories.value.forEach(cat => {
      grouped[cat.id] = expenses
        .filter(t => t.category === cat.id)
        .reduce((sum, t) => sum + t.amount, 0)
    })
    
    return grouped
  })

  const monthlyData = computed(() => {
    const months = {}
    transactions.value.forEach(transaction => {
      const month = new Date(transaction.date).toISOString().slice(0, 7)
      if (!months[month]) {
        months[month] = { income: 0, expenses: 0 }
      }
      if (transaction.type === 'income') {
        months[month].income += transaction.amount
      } else {
        months[month].expenses += transaction.amount
      }
    })
    return months
  })

  // Actions
  const addTransaction = async (transaction) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId,
        createdAt: new Date()
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error adding transaction:', error)
      throw error
    }
  }

  const updateTransaction = async (id, updates) => {
    try {
      const docRef = doc(db, 'transactions', id)
      await updateDoc(docRef, updates)
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  }

  const deleteTransaction = async (id) => {
    try {
      const docRef = doc(db, 'transactions', id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  // Add this helper to process recurring transactions
  const processRecurringTransactions = async () => {
    const today = new Date().toISOString().slice(0, 10)
    for (const tx of transactions.value) {
      if (tx.recurring && tx.recurring.nextDate && tx.userId === auth.currentUser?.uid) {
        // If nextDate is today or earlier
        if (tx.recurring.nextDate <= today) {
          // Create a new transaction for this occurrence
          const newDate = getNextRecurringDate(tx.recurring.nextDate, tx.recurring.type, tx.recurring.interval)
          await addTransaction({
            ...tx,
            date: tx.recurring.nextDate,
            recurring: tx.recurring, // keep recurring info
            id: undefined, // remove id for new doc
            createdAt: new Date()
          })
          // Update the original transaction's nextDate
          await updateTransaction(tx.id, {
            'recurring.nextDate': newDate
          })
        }
      }
    }
  }

  // Helper to calculate the next recurring date
  function getNextRecurringDate(date, type, interval) {
    const d = new Date(date)
    switch (type) {
      case 'daily':
        d.setDate(d.getDate() + interval)
        break
      case 'weekly':
        d.setDate(d.getDate() + 7 * interval)
        break
      case 'monthly':
        d.setMonth(d.getMonth() + interval)
        break
      case 'yearly':
        d.setFullYear(d.getFullYear() + interval)
        break
    }
    return d.toISOString().slice(0, 10)
  }

  // Import notification settings from Notifications.vue
  let notificationSettings = { lowBalance: true, recurringDue: true, goalDeadline: true }
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('notificationSettings')
      if (saved) notificationSettings = JSON.parse(saved)
    } catch {}
  }

  // Helper to trigger notifications
  const triggerNotifications = async () => {
    const userId = auth.currentUser?.uid
    if (!userId) return
    // Low balance
    if (notificationSettings.lowBalance && balance.value < 1000) {
      const existing = notifications.value.find(n => n.type === 'low-balance')
      if (!existing || (existing && !existing.read)) {
        await addNotification({
          type: 'low-balance',
          message: 'Your balance is below ₹1,000. Consider reviewing your expenses.',
          relatedId: null
        })
      }
    }
    // Upcoming recurring transactions (due in 2 days)
    const today = new Date()
    for (const tx of transactions.value) {
      if (notificationSettings.recurringDue && tx.recurring && tx.recurring.nextDate) {
        const nextDate = new Date(tx.recurring.nextDate)
        const diff = (nextDate - today) / (1000 * 60 * 60 * 24)
        if (diff >= 0 && diff <= 2) {
          const existing = notifications.value.find(n => n.type === 'recurring-due' && n.relatedId === tx.id)
          if (!existing || (existing && !existing.read)) {
            await addNotification({
              type: 'recurring-due',
              message: `Upcoming recurring transaction: ${tx.description || tx.category} of ₹${tx.amount} is due on ${tx.recurring.nextDate}.`,
              relatedId: tx.id
            })
          }
        }
      }
    }
    // Goal deadlines (goal progress < amount and createdAt older than 30 days)
    const now = new Date()
    for (const goal of goals.value) {
      if (notificationSettings.goalDeadline && goal.amount > goal.progress) {
        const created = new Date(goal.createdAt)
        const days = (now - created) / (1000 * 60 * 60 * 24)
        if (days > 30) {
          const existing = notifications.value.find(n => n.type === 'goal-deadline' && n.relatedId === goal.id)
          if (!existing || (existing && !existing.read)) {
            await addNotification({
              type: 'goal-deadline',
              message: `Goal "${goal.name}" is still in progress after 30 days. Keep going!`,
              relatedId: goal.id
            })
          }
        }
      }
    }
  }

  const fetchTransactions = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      )

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        transactions.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Process recurring transactions after loading
        await processRecurringTransactions()
        // Trigger notifications
        await triggerNotifications()
      })

      return unsubscribe
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  const addGoal = async (goal) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')

      const docRef = await addDoc(collection(db, 'goals'), {
        ...goal,
        userId,
        createdAt: new Date(),
        progress: 0
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error adding goal:', error)
      throw error
    }
  }

  const updateGoal = async (id, updates) => {
    try {
      const docRef = doc(db, 'goals', id)
      await updateDoc(docRef, updates)
    } catch (error) {
      console.error('Error updating goal:', error)
      throw error
    }
  }

  const deleteGoal = async (id) => {
    try {
      const docRef = doc(db, 'goals', id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  const fetchGoals = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const q = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        goals.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Trigger notifications
        triggerNotifications()
      })

      return unsubscribe
    } catch (error) {
      console.error('Error fetching goals:', error)
      throw error
    }
  }

  // Category CRUD with Firestore
  const fetchCategories = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return
      const q = query(
        collection(db, 'categories'),
        where('userId', '==', userId),
        orderBy('name', 'asc')
      )
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          // If no categories, initialize with defaults and wait for Firestore to sync
          await Promise.all(defaultCategories.map(cat => addCategory(cat)))
          // Do not set categories.value here; snapshot will fire again after add
        } else {
          categories.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        }
      })
      return unsubscribe
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  const addCategory = async (category) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')
      // Remove id if present (Firestore will generate one)
      const { id, ...catData } = category
      const docRef = await addDoc(collection(db, 'categories'), {
        ...catData,
        userId
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding category:', error)
      throw error
    }
  }

  const updateCategory = async (id, updates) => {
    try {
      const docRef = doc(db, 'categories', id)
      await updateDoc(docRef, updates)
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  const deleteCategory = async (id) => {
    try {
      // Prevent deleting if in use by any transaction
      const inUse = transactions.value.some(t => t.category === id)
      if (inUse) throw new Error('Cannot delete category: it is used by one or more transactions.')
      const docRef = doc(db, 'categories', id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  const fetchNotifications = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      )
      const unsubscribe = onSnapshot(q, (snapshot) => {
        notifications.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      })
      return unsubscribe
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  const addNotification = async (notif) => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) throw new Error('User not authenticated')
      await addDoc(collection(db, 'notifications'), {
        ...notif,
        userId,
        read: false,
        date: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error adding notification:', error)
      throw error
    }
  }

  const markNotificationRead = async (id) => {
    try {
      const docRef = doc(db, 'notifications', id)
      await updateDoc(docRef, { read: true })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  return {
    // State
    transactions,
    goals,
    categories,
    notifications,
    
    // Getters
    totalIncome,
    totalExpenses,
    balance,
    expensesByCategory,
    monthlyData,
    
    // Actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactions,
    addGoal,
    updateGoal,
    deleteGoal,
    fetchGoals,
    // Category actions
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchNotifications,
    addNotification,
    markNotificationRead
  }
}) 