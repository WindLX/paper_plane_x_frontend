import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { ApiError, type BlobTransferOptions } from '@/api/core'
import { useProjectExports } from './useProjectExports'
import type { ProjectExportJob } from '@/types/api'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  cancel: vi.fn(),
  download: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('@/api', () => ({
  api: {
    listProjectExports: mocks.list,
    createProjectExport: mocks.create,
    cancelProjectExport: mocks.cancel,
    downloadProjectExport: mocks.download,
  },
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('./useNotify', () => ({ useNotify: () => ({ push: mocks.notify }) }))
vi.mock('@/i18n', () => ({ translate: (key: string) => key }))

const job: ProjectExportJob = {
  export_id: 'exp-synthetic',
  project_id: 'prj-a',
  status: 'queued',
  phase: 'queued',
  processed_files: 0,
  total_files: null,
  current_file: null,
  error: null,
  download_name: null,
  file_size: null,
  created_at: '2026-10-09T00:00:00Z',
  finished_at: null,
  expires_at: null,
  cancel_requested: false,
}
const scopes: ReturnType<typeof effectScope>[] = []
function setup() {
  const project = ref('prj-a')
  const scope = effectScope()
  scopes.push(scope)
  const ctrl = scope.run(() => useProjectExports(project))!
  return { project, ctrl, scope }
}
async function flush() {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.list.mockResolvedValue({ items: [] })
  mocks.create.mockResolvedValue(job)
})
afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop()
  vi.useRealTimers()
})

describe('background project exports', () => {
  it('restores active jobs and stops polling when its view is disposed', async () => {
    mocks.list.mockResolvedValue({ items: [job] })
    const { ctrl, scope } = setup()
    await flush()
    expect(ctrl.jobs[0]?.export_id).toBe(job.export_id)
    await vi.advanceTimersByTimeAsync(1000)
    expect(mocks.list).toHaveBeenCalledTimes(2)
    scope.stop()
    await vi.advanceTimersByTimeAsync(3000)
    expect(mocks.list).toHaveBeenCalledTimes(2)
  })
  it('does not replace another project with an old submission result', async () => {
    let resolve!: (value: ProjectExportJob) => void
    mocks.create.mockReturnValue(
      new Promise<ProjectExportJob>((done) => {
        resolve = done
      }),
    )
    const { ctrl, project } = setup()
    const pending = ctrl.start({
      fields: ['title'],
      citations_mode: 'keep',
      include_sandbox_files: true,
    })
    project.value = 'prj-b'
    await flush()
    resolve(job)
    await pending
    expect(ctrl.jobs).toEqual([])
    expect(ctrl.submitting).toBe(false)
    expect(mocks.download).not.toHaveBeenCalled()
  })
  it('opens an existing job after a duplicate submission error', async () => {
    const { ctrl } = setup()
    await flush()
    mocks.create.mockRejectedValue(new ApiError(409, 'active export'))
    mocks.list.mockResolvedValue({ items: [job] })
    await ctrl.start({ fields: ['title'], citations_mode: 'keep', include_sandbox_files: true })
    expect(ctrl.jobs).toEqual([job])
    expect(ctrl.error).toBe('projectExports.alreadyActive')
    expect(ctrl.submitting).toBe(false)
  })
  it('refreshes canceled state and stops scheduling polls', async () => {
    mocks.list.mockResolvedValue({ items: [job] })
    const { ctrl } = setup()
    await flush()
    mocks.cancel.mockResolvedValue({ ...job, status: 'canceled' })
    mocks.list.mockResolvedValue({ items: [{ ...job, status: 'canceled' }] })
    await ctrl.cancel(job.export_id)
    expect(ctrl.jobs[0]?.status).toBe('canceled')
    await vi.advanceTimersByTimeAsync(2000)
    expect(mocks.list).toHaveBeenCalledTimes(2)
  })
  it('stops a transfer without canceling the completed server job', async () => {
    mocks.list.mockResolvedValue({ items: [{ ...job, status: 'completed', file_size: 20 }] })
    mocks.download.mockImplementation(
      (_project: string, _id: string, options: BlobTransferOptions) =>
        new Promise((_resolve, reject) => {
          options.signal!.addEventListener('abort', () =>
            reject(new DOMException('Stopped', 'AbortError')),
          )
        }),
    )
    const { ctrl } = setup()
    await flush()
    const download = ctrl.download(job.export_id)
    ctrl.stopDownload()
    await download
    expect(ctrl.downloadingExportId).toBeNull()
    expect(ctrl.error).toBeNull()
    expect(ctrl.jobs[0]?.status).toBe('completed')
    expect(mocks.cancel).not.toHaveBeenCalled()
  })
  it('allows an explicit retry after loading fails', async () => {
    mocks.list.mockRejectedValueOnce(new Error('synthetic connection failure'))
    const { ctrl } = setup()
    await flush()
    expect(ctrl.error).toBe('synthetic connection failure')
    await ctrl.load()
    expect(ctrl.error).toBeNull()
  })
})
