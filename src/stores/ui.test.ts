import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from './ui'
import { DRAWER_WIDTH_STORAGE_KEY } from '@/utils/drawerWidth'
import { SIDEBAR_WIDTH_STORAGE_KEY } from '@/utils/sidebarWidth'

let storage: Map<string, string>
beforeEach(() => {
  storage = new Map()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  })
  setActivePinia(createPinia())
})
afterEach(() => vi.unstubAllGlobals())

describe('right drawer width preference', () => {
  it('starts at the existing 512px width when no preference exists', () => {
    expect(useUiStore().drawerWidth).toBe(512)
  })
  it('previews a drag without writing storage and persists on completion', () => {
    const ui = useUiStore()
    ui.setDrawerWidth(672, false)
    expect(ui.drawerWidth).toBe(672)
    expect(storage.has(DRAWER_WIDTH_STORAGE_KEY)).toBe(false)
    ui.setDrawerWidth(672)
    expect(storage.get(DRAWER_WIDTH_STORAGE_KEY)).toBe('672')
    setActivePinia(createPinia())
    expect(useUiStore().drawerWidth).toBe(672)
  })
  it('clamps saved widths and handles malformed stored values', () => {
    storage.set(DRAWER_WIDTH_STORAGE_KEY, '9999')
    expect(useUiStore().drawerWidth).toBe(960)
    setActivePinia(createPinia())
    storage.set(DRAWER_WIDTH_STORAGE_KEY, 'invalid')
    expect(useUiStore().drawerWidth).toBe(512)
  })
  it('retains unrelated theme and left-sidebar preferences', () => {
    storage.set('ppx-console-theme', 'dark')
    storage.set('ppx-console-sidebar-collapsed', 'true')
    const ui = useUiStore()
    ui.setDrawerWidth(700)
    expect(ui.darkMode).toBe(true)
    expect(ui.sidebarCollapsed).toBe(true)
    expect(storage.get('ppx-console-theme')).toBe('dark')
    expect(storage.get('ppx-console-sidebar-collapsed')).toBe('true')
  })
})

describe('left navigation width preference', () => {
  it('saves an expanded width independently of collapsing navigation', () => {
    const ui = useUiStore()
    expect(ui.sidebarWidth).toBe(240)
    ui.setSidebarWidth(352)
    ui.setSidebarCollapsed(true)
    expect(ui.sidebarWidth).toBe(352)
    expect(storage.get(SIDEBAR_WIDTH_STORAGE_KEY)).toBe('352')
    setActivePinia(createPinia())
    expect(useUiStore().sidebarWidth).toBe(352)
    expect(useUiStore().sidebarCollapsed).toBe(true)
  })
  it('bounds incoming widths and handles invalid persisted data', () => {
    const ui = useUiStore()
    ui.setSidebarWidth(80)
    expect(ui.sidebarWidth).toBe(200)
    ui.setSidebarWidth(700)
    expect(ui.sidebarWidth).toBe(480)
    storage.set(SIDEBAR_WIDTH_STORAGE_KEY, 'invalid')
    setActivePinia(createPinia())
    expect(useUiStore().sidebarWidth).toBe(240)
  })
})
