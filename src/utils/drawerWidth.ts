export const DEFAULT_DRAWER_WIDTH = 512
export const MIN_DRAWER_WIDTH = 320
export const MAX_DRAWER_WIDTH = 960
export const DRAWER_WIDTH_STORAGE_KEY = 'ppx-console-drawer-width'

export function clampDrawerWidth(width: number): number {
  if (!Number.isFinite(width)) return DEFAULT_DRAWER_WIDTH
  return Math.round(Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, width)))
}
