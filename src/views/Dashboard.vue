<template>
  <div>
    <!-- UserProfile removed from Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Balance Card -->
      <div class="card col-span-1 flex flex-col items-center justify-center">
        <div class="text-lg font-semibold">Current Balance</div>
        <div class="text-3xl font-bold mt-2" :class="balance >= 0 ? 'text-success-600' : 'text-danger-600'">
          {{ currency(balance) }}
        </div>
        <div class="flex space-x-4 mt-4">
          <div class="text-sm text-gray-500 dark:text-gray-400">Income: <span class="text-success-600 font-semibold">{{ currency(totalIncome) }}</span></div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Expenses: <span class="text-danger-600 font-semibold">{{ currency(totalExpenses) }}</span></div>
        </div>
      </div>
      <!-- Pie Chart -->
      <div class="card col-span-1">
        <div class="font-semibold mb-2">Expenses by Category</div>
        <PieChart :data="pieChartData" :options="pieChartOptions" />
      </div>
      <!-- Bar Chart -->
      <div class="card col-span-1">
        <div class="font-semibold mb-2">Monthly Overview</div>
        <BarChart :data="barChartData" :options="barChartOptions" />
      </div>
    </div>

    <!-- Filters and Add Transaction -->
    <div class="flex flex-col md:flex-row md:items-end md:space-x-4 mb-6">
      <div class="flex space-x-2 mb-2 md:mb-0">
        <select v-model="filterCategory" class="input">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <input type="month" v-model="filterMonth" class="input" />
      </div>
      <div class="flex-1"></div>
      <button @click="showAddModal = true" class="btn btn-primary">+ Add Transaction</button>
    </div>

    <!-- Transactions List -->
    <div class="card mb-8">
      <div class="font-semibold mb-4">Transactions</div>
      <div v-if="filteredTransactions.length === 0" class="text-gray-500 dark:text-gray-400">No transactions found.</div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="t in filteredTransactions" :key="t.id" class="py-3 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ categoryIcon(t.category) }}</span>
            <div>
              <div class="font-medium flex items-center gap-2">
                {{ t.description || categoryName(t.category) }}
                <svg v-if="t.recurring" class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 1 19 5.633"/></svg>
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-300">{{ formatDate(t.date) }}</div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <div :class="t.type === 'income' ? 'text-success-600' : 'text-danger-600'" class="font-semibold">
              {{ t.type === 'income' ? '+' : '-' }}{{ currency(t.amount) }}
            </div>
            <button @click="openEditTransaction(t)" class="btn btn-secondary px-2 py-1 text-xs">Edit</button>
            <button @click="deleteTransaction(t.id)" class="btn btn-danger px-2 py-1 text-xs">Delete</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Savings Goals -->
    <div class="card mb-8">
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold">Savings Goals</div>
        <button @click="showAddGoalModal = true" class="btn btn-primary btn-sm">+ Add Goal</button>
      </div>
      <div v-if="goals.length === 0" class="text-gray-500 dark:text-gray-400">No goals set.</div>
      <ul v-else class="space-y-4">
        <li v-for="goal in goals" :key="goal.id">
          <div class="flex justify-between items-center mb-1">
            <div class="font-medium">{{ goal.name }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ currency(goal.progress) }} / {{ currency(goal.amount) }}</div>
            <div class="flex space-x-2">
              <button @click="openEditGoal(goal)" class="btn btn-secondary btn-sm px-2 py-1 text-xs">Edit</button>
              <button @click="deleteGoal(goal.id)" class="btn btn-danger btn-sm px-2 py-1 text-xs">Delete</button>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="bg-primary-500 h-3 rounded-full" :style="{ width: ((goal.progress / goal.amount) * 100) + '%' }"></div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Category Budgets -->
    <div class="card mb-8">
      <div class="font-semibold mb-4">Category Budgets</div>
      <div v-for="cat in categories" :key="cat.id" class="mb-4">
        <div class="flex justify-between items-center mb-1">
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </div>
          <div v-if="limits[cat.id]">
            <span :class="progress(cat.id) >= 1 ? 'text-danger-600 font-bold' : progress(cat.id) >= 0.8 ? 'text-warning-600 font-bold' : 'text-gray-600'">
              {{ currency(categorySpent(cat.id)) }} / {{ currency(limits[cat.id]) }}
            </span>
          </div>
          <div v-else class="text-gray-400 dark:text-gray-300">No limit</div>
        </div>
        <div v-if="limits[cat.id]" class="w-full bg-gray-200 rounded-full h-3">
          <div :class="progress(cat.id) >= 1 ? 'bg-danger-500' : progress(cat.id) >= 0.8 ? 'bg-warning-400' : 'bg-primary-500'" class="h-3 rounded-full" :style="{ width: Math.min(progress(cat.id)*100, 100) + '%' }"></div>
        </div>
        <div v-if="progress(cat.id) >= 1" class="text-danger-600 text-xs font-semibold mt-1">Limit exceeded!</div>
        <div v-else-if="progress(cat.id) >= 0.8" class="text-warning-600 text-xs font-semibold mt-1">Approaching limit</div>
      </div>
    </div>

    <!-- Add/Edit Transaction Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div class="font-semibold mb-4">{{ showEditModal ? 'Edit Transaction' : 'Add Transaction' }}</div>
        <form @submit.prevent="showEditModal ? updateTransaction() : addTransaction()">
          <div v-if="error && !showEditModal" class="mb-2 text-danger-600">{{ error }}</div>
          <div v-if="updateError && showEditModal" class="mb-2 text-danger-600">{{ updateError }}</div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select v-model="form.type" class="input" required>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select v-model="form.category" class="input" required>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Amount</label>
            <input v-model.number="form.amount" type="number" min="0.01" step="0.01" class="input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input v-model="form.date" type="date" class="input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <input v-model="form.description" type="text" class="input" placeholder="Optional" />
          </div>
          <div class="form-group">
            <label class="form-label flex items-center gap-2">
              <input type="checkbox" v-model="form.isRecurring" class="mr-2" />
              Make this a recurring transaction
            </label>
          </div>
          <div v-if="form.isRecurring" class="form-group flex gap-2 items-center">
            <label class="form-label">Repeat every</label>
            <input v-model.number="form.recurringInterval" type="number" min="1" class="input w-16" />
            <select v-model="form.recurringType" class="input">
              <option value="daily">Day(s)</option>
              <option value="weekly">Week(s)</option>
              <option value="monthly">Month(s)</option>
              <option value="yearly">Year(s)</option>
            </select>
          </div>
          <div class="flex justify-end space-x-2 mt-4">
            <button type="button" @click="closeTransactionModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ showEditModal ? 'Update' : 'Add' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add/Edit Goal Modal -->
    <div v-if="showAddGoalModal || showEditGoalModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div class="font-semibold mb-4">{{ showEditGoalModal ? 'Edit Goal' : 'Add Goal' }}</div>
        <form @submit.prevent="showEditGoalModal ? updateGoal() : addGoal()">
          <div v-if="goalError && !showEditGoalModal" class="mb-2 text-danger-600">{{ goalError }}</div>
          <div v-if="updateGoalError && showEditGoalModal" class="mb-2 text-danger-600">{{ updateGoalError }}</div>
          <div class="form-group">
            <label class="form-label">Goal Name</label>
            <input v-model="goalForm.name" type="text" class="input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Target Amount</label>
            <input v-model.number="goalForm.amount" type="number" min="0.01" step="0.01" class="input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Current Progress</label>
            <input v-model.number="goalForm.progress" type="number" min="0" step="0.01" class="input" required />
          </div>
          <div class="flex justify-end space-x-2 mt-4">
            <button type="button" @click="closeGoalModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ showEditGoalModal ? 'Update' : 'Add' }}</button>
          </div>
        </form>
      </div>
    </div>

    <div class="flex flex-wrap gap-4 mb-6">
      <button @click="exportTransactions('csv')" class="btn btn-secondary">Export Transactions (CSV)</button>
      <button @click="exportTransactions('excel')" class="btn btn-secondary">Export Transactions (Excel)</button>
      <button @click="exportGoals('csv')" class="btn btn-secondary">Export Goals (CSV)</button>
      <button @click="exportGoals('excel')" class="btn btn-secondary">Export Goals (Excel)</button>
      <label class="btn btn-secondary cursor-pointer">
        Import Transactions
        <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" @change="importTransactions" class="hidden" />
      </label>
      <label class="btn btn-secondary cursor-pointer">
        Import Goals
        <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" @change="importGoals" class="hidden" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBudgetStore } from '../stores/budget'
import PieChart from '../components/PieChart.vue'
import BarChart from '../components/BarChart.vue'
// UserProfile import removed
import { format, parseISO } from 'date-fns'

const store = useBudgetStore()
const { categories, fetchCategories, fetchTransactions, fetchGoals, addTransaction: addTx, updateTransaction: updateTx, deleteTransaction: deleteTx, addGoal: addG, updateGoal: updateG, deleteGoal: deleteG } = store

const showAddModal = ref(false)
const showEditModal = ref(false)
const editTransactionId = ref(null)
const filterCategory = ref('')
const filterMonth = ref('')
const form = ref({
  type: 'expense',
  category: 'food',
  amount: 0,
  date: '',
  description: '',
  isRecurring: false,
  recurringType: 'monthly',
  recurringInterval: 1
})
const error = ref('') // Error for transaction modal
const updateError = ref('') // Error for updating transaction
const deleteError = ref('') // Error for deleting transaction

const showAddGoalModal = ref(false)
const showEditGoalModal = ref(false)
const editGoalId = ref(null)
const goalForm = ref({
  name: '',
  amount: 0,
  progress: 0
})
const goalError = ref('') // Error for goal modal
const updateGoalError = ref('') // Error for updating goal
const deleteGoalError = ref('') // Error for deleting goal

const currencyCode = ref(localStorage.getItem('currency') || 'INR')
const currencySymbol = computed(() => {
  switch (currencyCode.value) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'GBP': return '£'
    case 'JPY': return '¥'
    case 'CNY': return '¥'
    case 'AUD': return 'A$'
    case 'CAD': return 'C$'
    case 'SGD': return 'S$'
    case 'ZAR': return 'R'
    default: return '₹'
  }
})

const limits = ref(JSON.parse(localStorage.getItem('budgetLimits') || '{}'))
function categorySpent(catId) {
  return store.transactions.filter(t => t.type === 'expense' && t.category === catId).reduce((sum, t) => sum + t.amount, 0)
}
function progress(catId) {
  if (!limits.value[catId]) return 0
  return categorySpent(catId) / limits.value[catId]
}

onMounted(() => {
    fetchCategories()
    fetchTransactions()
    fetchGoals()
})

// Set default category when categories are loaded
watch(
  () => categories.length,
  (newLen) => {
    if (newLen > 0 && !form.value.category) {
      form.value.category = categories[0].id
    }
  }
)

const totalIncome = computed(() => store.totalIncome)
const totalExpenses = computed(() => store.totalExpenses)
const balance = computed(() => store.balance)
const goals = computed(() => store.goals)

const filteredTransactions = computed(() => {
  return store.transactions.filter(t => {
    const matchCategory = !filterCategory.value || t.category === filterCategory.value
    const matchMonth = !filterMonth.value || t.date.startsWith(filterMonth.value)
    return matchCategory && matchMonth
  })
})

const pieChartData = computed(() => {
  const data = []
  const labels = []
  const bgColors = []
  for (const cat of categories) {
    if (cat.id === 'income') continue
    const value = store.expensesByCategory[cat.id] || 0
    if (value > 0) {
      data.push(value)
      labels.push(cat.name)
      bgColors.push(cat.color)
    }
  }
  return {
    labels,
    datasets: [{ data, backgroundColor: bgColors }]
  }
})

const pieChartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } }

const barChartData = computed(() => {
  const months = store.monthlyData
  const labels = Object.keys(months).sort()
  return {
    labels,
    datasets: [
      {
        label: 'Income',
        backgroundColor: '#22c55e',
        data: labels.map(m => months[m].income)
      },
      {
        label: 'Expenses',
        backgroundColor: '#ef4444',
        data: labels.map(m => months[m].expenses)
      }
    ]
  }
})
const barChartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } }

function currency(val) {
  return val.toLocaleString(undefined, { style: 'currency', currency: currencyCode.value })
}
function formatDate(date) {
  return format(parseISO(date), 'MMM d, yyyy')
}
function categoryName(id) {
  const cat = categories.find(c => c.id === id)
  return cat ? cat.name : id
}
function categoryIcon(id) {
  const cat = categories.find(c => c.id === id)
  return cat ? cat.icon : '❓'
}

// Transaction CRUD
async function addTransaction() {
  error.value = ''
  try {
    const tx = { ...form.value }
    if (tx.isRecurring) {
      tx.recurring = {
        type: tx.recurringType,
        interval: tx.recurringInterval,
        nextDate: tx.date
      }
    } else {
      tx.recurring = null
    }
    await addTx(tx)
    showAddModal.value = false
    form.value = { type: 'expense', category: 'food', amount: 0, date: '', description: '', isRecurring: false, recurringType: 'monthly', recurringInterval: 1 }
  } catch (err) {
    error.value = err.message || 'Failed to add transaction. Please try again.'
  }
}
function openEditTransaction(t) {
  form.value = {
    ...t,
    isRecurring: !!t.recurring,
    recurringType: t.recurring?.type || 'monthly',
    recurringInterval: t.recurring?.interval || 1
  }
  editTransactionId.value = t.id
  showEditModal.value = true
}
async function updateTransaction() {
  updateError.value = ''
  try {
    const tx = { ...form.value }
    if (tx.isRecurring) {
      tx.recurring = {
        type: tx.recurringType,
        interval: tx.recurringInterval,
        nextDate: tx.date
      }
    } else {
      tx.recurring = null
    }
    await updateTx(editTransactionId.value, tx)
    showEditModal.value = false
    editTransactionId.value = null
    form.value = { type: 'expense', category: 'food', amount: 0, date: '', description: '', isRecurring: false, recurringType: 'monthly', recurringInterval: 1 }
  } catch (err) {
    updateError.value = err.message || 'Failed to update transaction. Please try again.'
  }
}
async function deleteTransaction(id) {
  deleteError.value = ''
  if (confirm('Delete this transaction?')) {
    try {
      await deleteTx(id)
    } catch (err) {
      deleteError.value = err.message || 'Failed to delete transaction. Please try again.'
      alert(deleteError.value)
    }
  }
}
function closeTransactionModal() {
  showAddModal.value = false
  showEditModal.value = false
  editTransactionId.value = null
  form.value = { type: 'expense', category: 'food', amount: 0, date: '', description: '', isRecurring: false, recurringType: 'monthly', recurringInterval: 1 }
  error.value = ''
}

// Goal CRUD
function openEditGoal(goal) {
  goalForm.value = { name: goal.name, amount: goal.amount, progress: goal.progress }
  editGoalId.value = goal.id
  showEditGoalModal.value = true
}
async function addGoal() {
  goalError.value = ''
  try {
    await addG({ ...goalForm.value })
    showAddGoalModal.value = false
    goalForm.value = { name: '', amount: 0, progress: 0 }
  } catch (err) {
    goalError.value = err.message || 'Failed to add goal. Please try again.'
  }
}
async function updateGoal() {
  updateGoalError.value = ''
  try {
    await updateG(editGoalId.value, { ...goalForm.value })
    showEditGoalModal.value = false
    editGoalId.value = null
    goalForm.value = { name: '', amount: 0, progress: 0 }
  } catch (err) {
    updateGoalError.value = err.message || 'Failed to update goal. Please try again.'
  }
}
async function deleteGoal(id) {
  deleteGoalError.value = ''
  if (confirm('Delete this goal?')) {
    try {
      await deleteG(id)
    } catch (err) {
      deleteGoalError.value = err.message || 'Failed to delete goal. Please try again.'
      alert(deleteGoalError.value)
    }
  }
}
function closeGoalModal() {
  showAddGoalModal.value = false
  showEditGoalModal.value = false
  editGoalId.value = null
  goalForm.value = { name: '', amount: 0, progress: 0 }
  goalError.value = ''
}

function exportTransactions(format) {
  const data = store.transactions.map(t => ({
    ...t,
    // Flatten recurring for CSV
    recurringType: t.recurring?.type || '',
    recurringInterval: t.recurring?.interval || '',
    recurringNextDate: t.recurring?.nextDate || ''
  }))
  if (format === 'csv') {
    const csv = toCSV(data, [
      'id','type','category','amount','date','description','recurringType','recurringInterval','recurringNextDate','createdAt'
    ])
    downloadFile(csv, 'transactions.csv', 'text/csv')
  } else {
    // Excel stub
    alert('Excel export coming soon!')
  }
}

function exportGoals(format) {
  const data = store.goals
  if (format === 'csv') {
    const csv = toCSV(data, [
      'id','name','amount','progress','createdAt'
    ])
    downloadFile(csv, 'goals.csv', 'text/csv')
  } else {
    // Excel stub
    alert('Excel export coming soon!')
  }
}

function toCSV(arr, headers) {
  const escape = v => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const rows = [headers.join(',')]
  for (const obj of arr) {
    rows.push(headers.map(h => escape(obj[h])).join(','))
  }
  return rows.join('\n')
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

async function importTransactions(e) {
  const file = e.target.files[0]
  if (!file) return
  const text = await file.text()
  const rows = text.split(/\r?\n/).filter(Boolean)
  const headers = rows[0].split(',')
  for (let i = 1; i < rows.length; i++) {
    const values = parseCSVRow(rows[i])
    const obj = Object.fromEntries(headers.map((h, j) => [h, values[j]]))
    // Convert fields
    obj.amount = Number(obj.amount)
    if (obj.recurringType) {
      obj.recurring = {
        type: obj.recurringType,
        interval: Number(obj.recurringInterval),
        nextDate: obj.recurringNextDate
      }
    } else {
      obj.recurring = null
    }
    await store.addTransaction(obj)
  }
  alert('Transactions imported!')
  e.target.value = ''
}

async function importGoals(e) {
  const file = e.target.files[0]
  if (!file) return
  const text = await file.text()
  const rows = text.split(/\r?\n/).filter(Boolean)
  const headers = rows[0].split(',')
  for (let i = 1; i < rows.length; i++) {
    const values = parseCSVRow(rows[i])
    const obj = Object.fromEntries(headers.map((h, j) => [h, values[j]]))
    obj.amount = Number(obj.amount)
    obj.progress = Number(obj.progress)
    await store.addGoal(obj)
  }
  alert('Goals imported!')
  e.target.value = ''
}

function parseCSVRow(row) {
  // Simple CSV parser for quoted values
  const regex = /"((?:[^"]|"")*)"|([^,]+)/g
  const out = []
  let match
  while ((match = regex.exec(row))) {
    out.push(match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2])
  }
  return out
}

watch(currencyCode, () => {
  localStorage.setItem('currency', currencyCode.value)
})
window.addEventListener('storage', () => {
  currencyCode.value = localStorage.getItem('currency') || 'INR'
})
</script> 