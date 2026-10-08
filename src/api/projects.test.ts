import { afterEach, describe, expect, it, vi } from 'vitest'
import { projectsApi } from './projects'

vi.mock('@/i18n', () => ({ translate: (key: string) => key }))
afterEach(() => vi.unstubAllGlobals())

describe('project files HTTP contract', () => {
  it('uploads multipart data without a JSON content type', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ file_path: '/notes/idea.md', bytes_written: 3 })),
      )
    vi.stubGlobal('fetch', fetch)
    const file = new File(['abc'], 'idea.md')
    await projectsApi.uploadProjectFile('project-one', '/notes/idea.md', file)
    const [url, init] = fetch.mock.calls[0]!
    expect(url).toContain('/projects/project-one/files/upload')
    expect(init.method).toBe('POST')
    expect(new Headers(init.headers).has('Content-Type')).toBe(false)
    expect(init.body).toBeInstanceOf(FormData)
    expect(init.body.get('file_path')).toBe('/notes/idea.md')
    expect(init.body.get('file').name).toBe('idea.md')
  })
  it('downloads raw bytes including CRLF and invalid UTF-8 without text decoding', async () => {
    const bytes = new Uint8Array([65, 13, 10, 255])
    const fetch = vi.fn().mockResolvedValue(new Response(bytes))
    vi.stubGlobal('fetch', fetch)
    const blob = await projectsApi.downloadProjectFile('project-one', '/notes/原文.txt')
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes)
    expect(fetch.mock.calls[0]![0]).toContain('file_path=%2Fnotes%2F%E5%8E%9F%E6%96%87.txt')
  })
  it('deletes a file or empty directory without a recursive query option', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"removed":"/empty"}'))
    vi.stubGlobal('fetch', fetch)
    await projectsApi.deleteProjectFile('project-one', '/empty')
    expect(fetch.mock.calls[0]![0]).toContain('files/content?file_path=%2Fempty')
    expect(fetch.mock.calls[0]![1].method).toBe('DELETE')
    expect(fetch.mock.calls[0]![0]).not.toContain('recursive')
  })
})
