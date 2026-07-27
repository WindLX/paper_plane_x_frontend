import { describe, expect, it } from 'vitest'

import { buildTaskListSearchParams } from './tasks'

describe('buildTaskListSearchParams', () => {
  it('serializes search, paging, and sorting while trimming the keyword', () => {
    const params = buildTaskListSearchParams(20, 10, 'desc', 'status', '  PAP-123  ')

    expect(params.get('offset')).toBe('20')
    expect(params.get('limit')).toBe('10')
    expect(params.get('sort_order')).toBe('desc')
    expect(params.get('sort_by')).toBe('status')
    expect(params.get('keyword')).toBe('PAP-123')
  })

  it('omits a blank keyword', () => {
    expect(buildTaskListSearchParams(0, 20, undefined, undefined, '  ').has('keyword')).toBe(false)
  })
})
