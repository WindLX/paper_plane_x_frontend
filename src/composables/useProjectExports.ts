import { onScopeDispose, reactive, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api'
import { ApiError, type BlobTransferProgress } from '@/api/core'
import { useNotify } from './useNotify'
import type { ProjectExportJob, ProjectExportRequest } from '@/types/api'

export function useProjectExports(projectId: Ref<string>) {
  const { t } = useI18n()
  const notify = useNotify()
  const jobs = ref<ProjectExportJob[]>([])
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const downloadingExportId = ref<string | null>(null)
  const downloadProgress = ref<BlobTransferProgress | null>(null)
  let transfer: AbortController | null = null
  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let generation = 0
  let loadSequence = 0
  let pendingDownload: string | null = null

  function stopPolling(): void {
    if (pollTimer !== null) clearTimeout(pollTimer)
    pollTimer = null
  }

  async function load(): Promise<void> {
    stopPolling()
    const owner = generation
    const sequence = ++loadSequence
    try {
      const response = await api.listProjectExports(projectId.value)
      if (owner !== generation || sequence !== loadSequence) return
      jobs.value = response.items
      error.value = null
      if (pendingDownload) {
        const job = response.items.find((item) => item.export_id === pendingDownload)
        if (job?.status === 'completed') {
          pendingDownload = null
          void download(job.export_id)
        } else if (job && !['queued', 'running'].includes(job.status)) pendingDownload = null
      }
      if (response.items.some((job) => job.status === 'queued' || job.status === 'running'))
        pollTimer = setTimeout(() => void load(), 1000)
    } catch (cause) {
      if (owner === generation && sequence === loadSequence)
        error.value = cause instanceof Error ? cause.message : t('projectExports.requestFailed')
    }
  }

  async function start(payload: ProjectExportRequest): Promise<void> {
    if (submitting.value) return
    const owner = generation
    submitting.value = true
    error.value = null
    try {
      const job = await api.createProjectExport(projectId.value, payload)
      if (owner !== generation) return
      jobs.value = [job, ...jobs.value.filter((item) => item.export_id !== job.export_id)]
      pendingDownload = job.export_id
      await load()
    } catch (cause) {
      if (owner !== generation) return
      if (cause instanceof ApiError && cause.status === 409) {
        await load()
        error.value = t('projectExports.alreadyActive')
      } else
        error.value = cause instanceof Error ? cause.message : t('projectExports.requestFailed')
    } finally {
      if (owner === generation) submitting.value = false
    }
  }

  async function cancel(exportId: string): Promise<void> {
    const owner = generation
    error.value = null
    try {
      await api.cancelProjectExport(projectId.value, exportId)
      if (owner === generation) {
        if (pendingDownload === exportId) pendingDownload = null
        await load()
      }
    } catch (cause) {
      if (owner === generation)
        error.value = cause instanceof Error ? cause.message : t('projectExports.requestFailed')
    }
  }

  async function download(exportId: string): Promise<void> {
    const job = jobs.value.find((item) => item.export_id === exportId)
    if (!job || downloadingExportId.value) return
    const owner = generation
    const controller = new AbortController()
    transfer = controller
    downloadingExportId.value = exportId
    downloadProgress.value = { received: 0, total: job.file_size }
    error.value = null
    try {
      const blob = await api.downloadProjectExport(projectId.value, exportId, {
        signal: controller.signal,
        onProgress: (progress) => {
          if (owner === generation) downloadProgress.value = progress
        },
      })
      if (owner !== generation || controller.signal.aborted) return
      const url = URL.createObjectURL(blob)
      try {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = job.download_name ?? `${job.export_id}.zip`
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      } finally {
        URL.revokeObjectURL(url)
      }
      notify.push(t('projectExports.downloadHandedOff'), 'success', 2400)
    } catch (cause) {
      if (owner === generation && !controller.signal.aborted)
        error.value = cause instanceof Error ? cause.message : t('projectExports.requestFailed')
    } finally {
      if (owner === generation) {
        downloadingExportId.value = null
        downloadProgress.value = null
        transfer = null
      }
    }
  }

  function stopDownload(): void {
    transfer?.abort()
  }

  watch(
    projectId,
    () => {
      generation++
      stopPolling()
      transfer?.abort()
      transfer = null
      jobs.value = []
      submitting.value = false
      downloadingExportId.value = null
      downloadProgress.value = null
      error.value = null
      pendingDownload = null
      void load()
    },
    { immediate: true },
  )
  onScopeDispose(() => {
    generation++
    stopPolling()
    transfer?.abort()
  })

  return reactive({
    jobs,
    submitting,
    error,
    downloadingExportId,
    downloadProgress,
    load,
    start,
    cancel,
    download,
    stopDownload,
  })
}
