import { describe, expect, it } from 'vitest'
import {
  clampFileTreeWidth,
  DEFAULT_FILE_TREE_WIDTH,
  MAX_FILE_TREE_WIDTH,
  MIN_FILE_TREE_WIDTH,
} from './fileTreeWidth'

describe('file tree width constraints', () => {
  it('defaults to the 256px workspace tree width', () => {
    expect(DEFAULT_FILE_TREE_WIDTH).toBe(256)
    expect(clampFileTreeWidth(Number.NaN)).toBe(256)
    expect(clampFileTreeWidth(Number.POSITIVE_INFINITY)).toBe(256)
  })

  it('bounds and rounds requested widths to the 180-400px range', () => {
    expect(MIN_FILE_TREE_WIDTH).toBe(180)
    expect(MAX_FILE_TREE_WIDTH).toBe(400)
    expect(clampFileTreeWidth(120)).toBe(180)
    expect(clampFileTreeWidth(9999)).toBe(400)
    expect(clampFileTreeWidth(241.6)).toBe(242)
    expect(clampFileTreeWidth(180)).toBe(180)
    expect(clampFileTreeWidth(400)).toBe(400)
  })
})
