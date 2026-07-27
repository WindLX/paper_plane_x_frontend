import { describe, expect, it } from 'vitest'

import type { LibrarySearchInputState } from '@/types/api'
import { LibrarySearchModeConflictError, resolveLibrarySearchSelection } from './librarySearch'

function state(overrides: Partial<LibrarySearchInputState> = {}): LibrarySearchInputState {
  return {
    rawInput: '',
    mode: 'simple',
    queryExpr: '',
    projectScope: '',
    paperId: '',
    parsedQuery: null,
    executionQuery: null,
    ...overrides,
  }
}

describe('resolveLibrarySearchSelection', () => {
  it('maps simple input to simple_query and trims it', () => {
    expect(resolveLibrarySearchSelection(state({ rawInput: '  pap-123  ' }))).toEqual({
      simpleQuery: 'pap-123',
      paperId: '',
      queryExpr: '',
      executionQuery: 'pap-123',
    })
  })

  it('maps advanced DSL and exact paper ID independently', () => {
    expect(
      resolveLibrarySearchSelection(
        state({ mode: 'advanced', queryExpr: ' (meta.title CONTAINS test) ' }),
      ),
    ).toMatchObject({
      simpleQuery: '',
      paperId: '',
      queryExpr: '(meta.title CONTAINS test)',
    })
    expect(
      resolveLibrarySearchSelection(state({ mode: 'advanced', paperId: ' pap-1 ' })),
    ).toMatchObject({
      simpleQuery: '',
      paperId: 'pap-1',
      queryExpr: '',
    })
  })

  it('allows an empty search and rejects conflicting advanced modes', () => {
    expect(resolveLibrarySearchSelection(state()).executionQuery).toBeNull()
    expect(() =>
      resolveLibrarySearchSelection(
        state({ mode: 'advanced', paperId: 'pap-1', queryExpr: '(meta.title CONTAINS x)' }),
      ),
    ).toThrow(LibrarySearchModeConflictError)
  })
})
