import { afterEach, describe, expect, it, vi } from 'vitest'

import { API_BASE_URL } from './core'
import { papersApi } from './papers'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('paper PDF URLs', () => {
  it('builds an inline URL and encodes the paper ID', () => {
    expect(papersApi.getPaperPdfUrl('paper/id with spaces')).toBe(
      `${API_BASE_URL}/papers/paper%2Fid%20with%20spaces/pdf`,
    )
  })

  it('builds an attachment URL', () => {
    expect(papersApi.getPaperPdfUrl('pap-1', true)).toBe(
      `${API_BASE_URL}/papers/pap-1/pdf?download=true`,
    )
  })

  it('checks availability with a one-byte range request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 206 }))
    vi.stubGlobal('fetch', fetchMock)

    await papersApi.checkPaperPdf('pap-1')

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/papers/pap-1/pdf`, {
      headers: { Range: 'bytes=0-0' },
      signal: undefined,
    })
  })

  it('reports an unavailable PDF response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('PDF unavailable', { status: 409 })),
    )

    await expect(papersApi.checkPaperPdf('pap-missing')).rejects.toThrow('PDF unavailable')
  })
})
