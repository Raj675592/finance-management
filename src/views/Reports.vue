<template>
  <div class="max-w-4xl w-full mx-auto py-10 px-2 sm:px-4">
    <h1 class="text-2xl font-bold mb-6">Reports & Analytics</h1>
    <div class="mb-6 flex flex-wrap gap-4 items-center">
      <label class="form-label">Time Range:</label>
      <select v-model="range" class="input">
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="custom">Custom</option>
      </select>
      <input v-if="range==='custom'" type="month" v-model="customStart" class="input" />
      <span v-if="range==='custom'">to</span>
      <input v-if="range==='custom'" type="month" v-model="customEnd" class="input" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card flex flex-col items-center justify-center w-full">
        <div class="text-lg font-semibold">Total Income</div>
        <div class="text-2xl font-bold mt-2 text-success-600">{{ currency(totalIncome) }}</div>
      </div>
      <div class="card flex flex-col items-center justify-center w-full">
        <div class="text-lg font-semibold">Total Expenses</div>
        <div class="text-2xl font-bold mt-2 text-danger-600">{{ currency(totalExpenses) }}</div>
      </div>
      <div class="card flex flex-col items-center justify-center w-full">
        <div class="text-lg font-semibold">Savings Rate</div>
        <div class="text-2xl font-bold mt-2 text-primary-600">{{ savingsRate }}%</div>
      </div>
    </div>
    <div class="mb-8">
      <h2 class="font-semibold mb-2">Trends</h2>
      <BarChart :data="trendChartData" :options="barChartOptions" />
    </div>
    <div class="mb-8">
      <h2 class="font-semibold mb-2">Category Breakdown</h2>
      <PieChart :data="categoryPieData" :options="pieChartOptions" />
    </div>
    <div class="flex flex-col sm:flex-row gap-4">
      <button class="btn btn-secondary">Export as PDF</button>
      <button class="btn btn-secondary">Export as CSV</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBudgetStore } from '../stores/budget'
import BarChart from '../components/BarChart.vue'
import PieChart from '../components/PieChart.vue'

const store = useBudgetStore()
const range = ref('month')
const customStart = ref('')
const customEnd = ref('')

const currencyCode = ref(localStorage.getItem('currency') || 'INR')
function currency(val) {
  return val.toLocaleString(undefined, { style: 'currency', currency: currencyCode.value })
}

const filteredTransactions = computed(() => {
  // Filter transactions by selected range
  const txs = store.transactions
  if (range.value === 'month') {
    const month = new Date().toISOString().slice(0, 7)
    return txs.filter(t => t.date.startsWith(month))
  } else if (range.value === 'year') {
    const year = new Date().toISOString().slice(0, 4)
    return txs.filter(t => t.date.startsWith(year))
  } else if (range.value === 'custom' && customStart.value && customEnd.value) {
    return txs.filter(t => t.date >= customStart.value + '-01' && t.date <= customEnd.value + '-31')
  }
  return txs
})

const totalIncome = computed(() => filteredTransactions.value.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))
const totalExpenses = computed(() => filteredTransactions.value.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))
const savingsRate = computed(() => {
  const income = totalIncome.value
  const expenses = totalExpenses.value
  if (!income) return 0
  return Math.round(((income - expenses) / income) * 100)
})

// Trends chart data (by month)
const trendChartData = computed(() => {
  // Group by month (YYYY-MM)
  const txs = filteredTransactions.value
  const months = {}
  txs.forEach(t => {
    const m = t.date.slice(0, 7)
    if (!months[m]) months[m] = { income: 0, expenses: 0 }
    if (t.type === 'income') months[m].income += t.amount
    else if (t.type === 'expense') months[m].expenses += t.amount
  })
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
      },
      {
        label: 'Savings',
        backgroundColor: '#3b82f6',
        data: labels.map(m => months[m].income - months[m].expenses)
      }
    ]
  }
})
const barChartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } }

// Category breakdown pie chart
const categoryPieData = computed(() => {
  const txs = filteredTransactions.value.filter(t => t.type === 'expense')
  const catMap = {}
  for (const t of txs) {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount
  }
  const labels = []
  const data = []
  const bgColors = []
  for (const cat of store.categories) {
    if (catMap[cat.id]) {
      labels.push(cat.name)
      data.push(catMap[cat.id])
      bgColors.push(cat.color)
    }
  }
  return {
    labels,
    datasets: [{ data, backgroundColor: bgColors }]
  }
})
const pieChartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } }
</script> 