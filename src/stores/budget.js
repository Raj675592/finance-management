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

  const fetchTransactions = async () => {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        transactions.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
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
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          // If no categories, initialize with defaults
          defaultCategories.forEach(async cat => {
            await addCategory(cat)
          })
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
      const docRef = doc(db, 'categories', id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  return {
    // State
    transactions,
    goals,
    categories,
    
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
    deleteCategory
  }
}) 