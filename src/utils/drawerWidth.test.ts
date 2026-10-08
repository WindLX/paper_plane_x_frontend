import { describe, expect, it } from 'vitest'
import { clampDrawerWidth } from './drawerWidth'

describe('right drawer size constraints', () => {
  it('limits and rounds requested widths', () => {
    expect(clampDrawerWidth(120)).toBe(320)
    expect(clampDrawerWidth(1234)).toBe(960)
    expect(clampDrawerWidth(614.6)).toBe(615)
    expect(clampDrawerWidth(Number.NaN)).toBe(512)
  })
})
