import { describe, expect, it } from 'vitest'

import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl, resolveAppConfig } from './config'

describe('frontend config', () => {
  it('falls back to the default API base URL', () => {
    expect(resolveAppConfig({}).apiBaseUrl).toBe(DEFAULT_API_BASE_URL)
  })

  it('normalizes trailing slashes', () => {
    expect(normalizeApiBaseUrl('http://127.0.0.1:8000/api/v1///')).toBe(
      'http://127.0.0.1:8000/api/v1',
    )
  })
})
