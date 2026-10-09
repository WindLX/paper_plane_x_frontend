import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestBlob, type BlobTransferProgress } from './core'

vi.mock('@/i18n', () => ({ translate: (key: string) => key }))
afterEach(() => vi.unstubAllGlobals())

describe('binary transfer progress', () => {
  it('preserves actionable resource errors without displaying the raw JSON envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: {
              message: 'Missing image',
              details: { references: [{ reference: 'images/a.png', reason: 'missing' }] },
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    await expect(requestBlob('/synthetic')).rejects.toMatchObject({
      status: 400,
      message: 'Missing image',
      resourceIssues: [{ reference: 'images/a.png', reason: 'missing' }],
    })
  })
  it.each([true, false])('counts actual received bytes (known length: %s)', async (known) => {
    const payloads = [new Uint8Array([65, 13, 10]), new Uint8Array([255, 0])]
    const response = new Response(
      new ReadableStream({
        start(controller) {
          for (const payload of payloads) controller.enqueue(payload)
          controller.close()
        },
      }),
      { headers: known ? { 'Content-Length': '5', 'Content-Type': 'application/zip' } : {} },
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
    const progress: BlobTransferProgress[] = []
    const ready = vi.fn()
    const blob = await requestBlob('/synthetic', undefined, {
      onResponse: ready,
      onProgress: (value) => progress.push(value),
    })
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([65, 13, 10, 255, 0]))
    expect(progress.map((value) => value.received)).toEqual([0, 3, 5])
    expect(progress.every((value) => value.total === (known ? 5 : null))).toBe(true)
    expect(ready).toHaveBeenCalledOnce()
  })
  it('passes cancellation to fetch', async () => {
    const controller = new AbortController()
    const fetch = vi.fn().mockRejectedValue(new DOMException('Stopped', 'AbortError'))
    vi.stubGlobal('fetch', fetch)
    controller.abort()
    await expect(
      requestBlob('/synthetic', undefined, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetch.mock.calls[0]![1].signal).toBe(controller.signal)
  })
})
