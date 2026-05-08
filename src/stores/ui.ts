import { defineStore } from 'pinia'
import { ref } from 'vue'

const THEME_STORAGE_KEY = 'ppx-console-theme'
const SIDEBAR_STORAGE_KEY = 'ppx-console-sidebar-collapsed'

function resolveInitialDarkMode(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
}

function resolveInitialSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true'
}

export const useUiStore = defineStore('ui', () => {
  const darkMode = ref(resolveInitialDarkMode())
  const sidebarCollapsed = ref(resolveInitialSidebarCollapsed())
  const mobileSidebarOpen = ref(false)

  function setDarkMode(nextValue: boolean): void {
    darkMode.value = nextValue
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextValue ? 'dark' : 'light')
    }
  }

  function toggleDarkMode(): void {
    setDarkMode(!darkMode.value)
  }

  function setSidebarCollapsed(nextValue: boolean): void {
    sidebarCollapsed.value = nextValue
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue))
    }
  }

  function toggleSidebar(): void {
    setSidebarCollapsed(!sidebarCollapsed.value)
  }

  function openMobileSidebar(): void {
    mobileSidebarOpen.value = true
  }

  function closeMobileSidebar(): void {
    mobileSidebarOpen.value = false
  }

  function toggleMobileSidebar(): void {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  return {
    darkMode,
    sidebarCollapsed,
    mobileSidebarOpen,
    setDarkMode,
    toggleDarkMode,
    setSidebarCollapsed,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    toggleMobileSidebar,
  }
})
