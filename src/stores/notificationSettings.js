import { ref } from 'vue'

const defaultSettings = { lowBalance: true, recurringDue: true, goalDeadline: true }
const settings = ref({ ...defaultSettings })

function loadSettings() {
  const saved = localStorage.getItem('notificationSettings')
  if (saved) Object.assign(settings.value, JSON.parse(saved))
}

function saveSettings() {
  localStorage.setItem('notificationSettings', JSON.stringify(settings.value))
}

// Load settings immediately on import
loadSettings()

export { settings, loadSettings, saveSettings } 