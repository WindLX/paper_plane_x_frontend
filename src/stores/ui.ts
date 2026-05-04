import { defineStore } from 'pinia'
import { ref } from 'vue'

export type DrawerContentType = 'paper' | 'task' | 'trace' | 'conversation' | 'deep_dive' | 'custom'

export type DrawerTab = 'overview' | 'traces' | 'paper'

export interface DrawerPayload {
  paperId?: string
  projectId?: string
  taskId?: string
  traceId?: string
  conversationId?: string
  title?: string
}

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
  const desktopSidebarCollapsed = ref(resolveInitialSidebarCollapsed())
  const mobileSidebarOpen = ref(false)
  const rightDrawerOpen = ref(false)
  const rightDrawerType = ref<DrawerContentType | null>(null)
  const rightDrawerPayload = ref<DrawerPayload | null>(null)
  const rightDrawerSource = ref<'local' | 'route'>('local')
  const rightDrawerActiveTab = ref<DrawerTab>('overview')
  const pageTitle = ref<string | null>(null)
  const pageSubtitle = ref<string | null>(null)

  function setDarkMode(nextValue: boolean): void {
    darkMode.value = nextValue
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextValue ? 'dark' : 'light')
    }
  }

  function toggleDarkMode(): void {
    setDarkMode(!darkMode.value)
  }

  function setDesktopSidebarCollapsed(nextValue: boolean): void {
    desktopSidebarCollapsed.value = nextValue
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue))
    }
  }

  function toggleDesktopSidebar(): void {
    setDesktopSidebarCollapsed(!desktopSidebarCollapsed.value)
  }

  function openMobileSidebar(): void {
    mobileSidebarOpen.value = true
  }

  function closeMobileSidebar(): void {
    mobileSidebarOpen.value = false
  }

  function openRightDrawer(
    type: DrawerContentType,
    payload: DrawerPayload,
    source: 'local' | 'route' = 'local',
  ): void {
    rightDrawerType.value = type
    rightDrawerPayload.value = payload
    rightDrawerSource.value = source
    rightDrawerActiveTab.value = 'overview'
    rightDrawerOpen.value = true
  }

  function closeRightDrawer(): void {
    rightDrawerOpen.value = false
    rightDrawerType.value = null
    rightDrawerPayload.value = null
    rightDrawerSource.value = 'local'
    rightDrawerActiveTab.value = 'overview'
  }

  function setRightDrawerTab(tab: DrawerTab): void {
    rightDrawerActiveTab.value = tab
  }

  function setPageTitle(title: string | null): void {
    pageTitle.value = title
  }

  function setPageSubtitle(subtitle: string | null): void {
    pageSubtitle.value = subtitle
  }

  function clearPageTitle(): void {
    pageTitle.value = null
  }

  function clearPageSubtitle(): void {
    pageSubtitle.value = null
  }

  return {
    darkMode,
    desktopSidebarCollapsed,
    mobileSidebarOpen,
    rightDrawerOpen,
    rightDrawerType,
    rightDrawerPayload,
    rightDrawerSource,
    rightDrawerActiveTab,
    pageTitle,
    pageSubtitle,
    setDarkMode,
    toggleDarkMode,
    setDesktopSidebarCollapsed,
    toggleDesktopSidebar,
    openMobileSidebar,
    closeMobileSidebar,
    openRightDrawer,
    closeRightDrawer,
    setRightDrawerTab,
    setPageTitle,
    setPageSubtitle,
    clearPageTitle,
    clearPageSubtitle,
  }
})
