import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  clampDrawerWidth,
  DEFAULT_DRAWER_WIDTH,
  DRAWER_WIDTH_STORAGE_KEY,
} from '@/utils/drawerWidth'

import {
  clampSidebarWidth,
  DEFAULT_SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from '@/utils/sidebarWidth'

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
  const storedDrawerWidth =
    typeof window === 'undefined' ? null : window.localStorage.getItem(DRAWER_WIDTH_STORAGE_KEY)
  const drawerWidth = ref(
    storedDrawerWidth === null || storedDrawerWidth.trim() === ''
      ? DEFAULT_DRAWER_WIDTH
      : clampDrawerWidth(Number(storedDrawerWidth)),
  )

  const storedSidebarWidth =
    typeof window === 'undefined' ? null : window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
  const sidebarWidth = ref(
    storedSidebarWidth === null || storedSidebarWidth.trim() === ''
      ? DEFAULT_SIDEBAR_WIDTH
      : clampSidebarWidth(Number(storedSidebarWidth)),
  )

  function setSidebarWidth(width: number): void {
    sidebarWidth.value = clampSidebarWidth(width)
    if (typeof window !== 'undefined')
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth.value))
  }

  function setDrawerWidth(width: number, persist = true): void {
    drawerWidth.value = clampDrawerWidth(width)
    if (persist && typeof window !== 'undefined')
      window.localStorage.setItem(DRAWER_WIDTH_STORAGE_KEY, String(drawerWidth.value))
  }

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
    drawerWidth,
    sidebarWidth,
    setSidebarWidth,
    setDrawerWidth,
    setDarkMode,
    toggleDarkMode,
    setSidebarCollapsed,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    toggleMobileSidebar,
  }
})
