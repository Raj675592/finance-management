<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Balance Card -->
      <div class="card col-span-1 flex flex-col items-center justify-center">
        <div class="text-lg font-semibold">Current Balance</div>
        <div class="text-3xl font-bold mt-2" :class="balance >= 0 ? 'text-success-600' : 'text-danger-600'">
          {{ currency(balance) }}
        </div>
        <div class="flex space-x-4 mt-4">
          <div class="text-sm text-gray-500">Income: <span class="text-success-600 font-semibold">{{ currency(totalIncome) }}</span></div>
          <div class="text-sm text-gray-500">Expenses: <span class="text-danger-600 font-semibold">{{ currency(totalExpenses) }}</span></div>
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
      <div v-if="filteredTransactions.length === 0" class="text-gray-500">No transactions found.</div>
      <ul v-else class="divide-y divide-gray-100">
        <li v-for="t in filteredTransactions" :key="t.id" class="py-3 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ categoryIcon(t.category) }}</span>
            <div>
              <div class="font-medium">{{ t.description || categoryName(t.category) }}</div>
              <div class="text-xs text-gray-400">{{ formatDate(t.date) }}</div>
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
      <div v-if="goals.length === 0" class="text-gray-500">No goals set.</div>
      <ul v-else class="space-y-4">
        <li v-for="goal in goals" :key="goal.id">
          <div class="flex justify-between items-center mb-1">
            <div class="font-medium">{{ goal.name }}</div>
            <div class="text-sm text-gray-500">{{ currency(goal.progress) }} / {{ currency(goal.amount) }}</div>
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

    <!-- Add/Edit Transaction Modal -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div class="font-semibold mb-4">{{ showEditModal ? 'Edit Transaction' : 'Add Transaction' }}</div>
        <form @submit.prevent="showEditModal ? updateTransaction() : addTransaction()">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBudgetStore } from '../stores/budget'
import PieChart from '../components/PieChart.vue'
import BarChart from '../components/BarChart.vue'
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
  description: ''
})

const showAddGoalModal = ref(false)
const showEditGoalModal = ref(false)
const editGoalId = ref(null)
const goalForm = ref({
  name: '',
  amount: 0,
  progress: 0
})

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
  return val.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
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
  await addTx({ ...form.value })
  showAddModal.value = false
  form.value = { type: 'expense', category: 'food', amount: 0, date: '', description: '' }
}
function openEditTransaction(t) {
  form.value = { ...t }
  editTransactionId.value = t.id
  showEditModal.value = true
}
async function updateTransaction() {
  await updateTx(editTransactionId.value, { ...form.value })
  showEditModal.value = false
  editTransactionId.value = null
  form.value = { type: 'expense', category: 'food', amount: 0, date: '', description: '' }
}
async function deleteTransaction(id) {
  if (confirm('Delete this transaction?')) {
    await deleteTx(id)
  }
}
function closeTransactionModal() {
  showAddModal.value = false
  showEditModal.value = false
  editTransactionId.value = null
  form.value = { type: 'expense', category: 'food', amount: 0, date: '', description: '' }
}

// Goal CRUD
function openEditGoal(goal) {
  goalForm.value = { name: goal.name, amount: goal.amount, progress: goal.progress }
  editGoalId.value = goal.id
  showEditGoalModal.value = true
}
async function addGoal() {
  await addG({ ...goalForm.value })
  showAddGoalModal.value = false
  goalForm.value = { name: '', amount: 0, progress: 0 }
}
async function updateGoal() {
  await updateG(editGoalId.value, { ...goalForm.value })
  showEditGoalModal.value = false
  editGoalId.value = null
  goalForm.value = { name: '', amount: 0, progress: 0 }
}
async function deleteGoal(id) {
  if (confirm('Delete this goal?')) {
    await deleteG(id)
  }
}
function closeGoalModal() {
  showAddGoalModal.value = false
  showEditGoalModal.value = false
  editGoalId.value = null
  goalForm.value = { name: '', amount: 0, progress: 0 }
}
</script> 