import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import type { PaperResponse } from '@/types/api'

import { usePaperBulkActions, type PaperBulkRun } from './usePaperBulkActions'

const apiMock = vi.hoisted(() => ({
  batchGetPapers: vi.fn(),
  deletePaper: vi.fn(),
  linkProjectPaper: vi.fn(),
  unlinkProjectPaper: vi.fn(),
}))

vi.mock('@/api', () => ({ api: apiMock }))

function makePaper(overrides: Partial<PaperResponse> = {}): PaperResponse {
  return {
    paper_id: 'p1',
    project_ids: [],
    title: null,
    authors: [],
    year: null,
    publication: null,
    doi: null,
    custom_meta: null,
    raw_pdf_path: null,
    raw_pdf_sha256: null,
    images_paths: [],
    extraction_status: 'COMPLETED',
    extraction_fact_check_status: 'PENDING',
    analysis_fact_check_status: 'PENDING',
    extraction_retry_count: 0,
    analysis_retry_count: 0,
    agent_note: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function page(items: PaperResponse[]) {
  return { items, total: items.length, offset: 0, limit: items.length }
}

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function createBulk() {
  const scope = effectScope()
  const bulk = scope.run(() => usePaperBulkActions())
  if (!bulk) throw new Error('effect scope did not create the bulk controller')
  return { bulk, stop: () => scope.stop() }
}

async function runOrFail(run: Promise<PaperBulkRun | null>): Promise<PaperBulkRun> {
  const outcome = await run
  if (outcome === null) throw new Error('bulk run did not start')
  return outcome
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('usePaperBulkActions', () => {
  it('skips missing papers and papers whose status blocks delete', async () => {
    apiMock.batchGetPapers.mockResolvedValue(
      page([
        makePaper({ paper_id: 'ready' }),
        makePaper({ paper_id: 'processing', extraction_status: 'PROCESSING' }),
        makePaper({ paper_id: 'pending', extraction_status: 'PENDING' }),
      ]),
    )
    apiMock.deletePaper.mockResolvedValue({ message: 'deleted' })

    const { bulk, stop } = createBulk()
    const outcome = await runOrFail(
      bulk.deletePapers(['ready', 'processing', 'pending', 'missing']),
    )

    expect(outcome.map((entry) => entry.status)).toEqual([
      'success',
      'skipped',
      'skipped',
      'skipped',
    ])
    expect(outcome.map((entry) => entry.reason)).toEqual([
      null,
      { kind: 'ineligible', code: 'status-mismatch' },
      { kind: 'ineligible', code: 'status-mismatch' },
      { kind: 'ineligible', code: 'missing' },
    ])
    expect(apiMock.deletePaper).toHaveBeenCalledTimes(1)
    expect(apiMock.deletePaper).toHaveBeenCalledWith('ready')
    stop()
  })

  it('reports already-linked and not-linked precisely for link and unlink', async () => {
    apiMock.batchGetPapers.mockResolvedValue(
      page([
        makePaper({ paper_id: 'loose' }),
        makePaper({ paper_id: 'attached', project_ids: ['proj'] }),
      ]),
    )
    apiMock.linkProjectPaper.mockResolvedValue({ message: 'linked' })
    apiMock.unlinkProjectPaper.mockResolvedValue({ message: 'unlinked' })

    const { bulk, stop } = createBulk()
    const linked = await runOrFail(bulk.linkPapersToProject('proj', ['loose', 'attached']))
    expect(linked.map((entry) => entry.status)).toEqual(['success', 'skipped'])
    expect(linked[1].reason).toEqual({ kind: 'ineligible', code: 'already-linked' })

    const unlinked = await runOrFail(bulk.unlinkPapersFromProject('proj', ['loose', 'attached']))
    expect(unlinked.map((entry) => entry.status)).toEqual(['skipped', 'success'])
    expect(unlinked[0].reason).toEqual({ kind: 'ineligible', code: 'not-linked' })

    expect(apiMock.linkProjectPaper).toHaveBeenCalledWith('proj', 'loose')
    expect(apiMock.unlinkProjectPaper).toHaveBeenCalledWith('proj', 'attached')
    stop()
  })

  it('fails only the chunk that errored and still runs the other chunks', async () => {
    const paperIds = Array.from({ length: 250 }, (_, index) => 'p' + index)
    apiMock.batchGetPapers.mockImplementation(async (chunk: string[]) => {
      if (chunk.includes('p100')) throw new Error('chunk 2 down')
      return page(chunk.map((paperId: string) => makePaper({ paper_id: paperId })))
    })
    apiMock.deletePaper.mockResolvedValue({ message: 'deleted' })

    const { bulk, stop } = createBulk()
    const outcome = await runOrFail(bulk.deletePapers(paperIds))

    expect(apiMock.batchGetPapers).toHaveBeenCalledTimes(3)
    const failed = outcome.filter((entry) => entry.status === 'failed')
    expect(failed).toHaveLength(100)
    expect(
      failed.every(
        (entry) => entry.reason?.kind === 'error' && entry.reason.message === 'chunk 2 down',
      ),
    ).toBe(true)
    expect(outcome.filter((entry) => entry.status === 'success')).toHaveLength(150)
    expect(apiMock.deletePaper).toHaveBeenCalledTimes(150)
    stop()
  })

  it('stops requesting chunks and writing once the scope is disposed', async () => {
    const paperIds = Array.from({ length: 250 }, (_, index) => 'p' + index)
    const gates: Array<() => void> = []
    apiMock.batchGetPapers.mockImplementation(async (chunk: string[]) => {
      await new Promise<void>((resolve) => gates.push(resolve))
      return page(chunk.map((paperId: string) => makePaper({ paper_id: paperId })))
    })
    apiMock.deletePaper.mockResolvedValue({ message: 'deleted' })

    const { bulk, stop } = createBulk()
    const run = bulk.deletePapers(paperIds)
    await flush()
    expect(apiMock.batchGetPapers).toHaveBeenCalledTimes(1)

    stop()
    gates.splice(0).forEach((release) => release())
    await flush()

    const outcome = await runOrFail(run)
    expect(outcome).toEqual([])
    expect(apiMock.batchGetPapers).toHaveBeenCalledTimes(1)
    expect(apiMock.deletePaper).not.toHaveBeenCalled()
  })
})
