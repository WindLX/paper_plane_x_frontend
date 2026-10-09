export const DEFAULT_FILE_TREE_WIDTH = 256
export const MIN_FILE_TREE_WIDTH = 180
export const MAX_FILE_TREE_WIDTH = 400
export const FILE_TREE_WIDTH_STORAGE_KEY = 'ppx-console-file-tree-width'

export function clampFileTreeWidth(width: number): number {
  if (!Number.isFinite(width)) return DEFAULT_FILE_TREE_WIDTH
  return Math.round(Math.min(MAX_FILE_TREE_WIDTH, Math.max(MIN_FILE_TREE_WIDTH, width)))
}
