import { computed, onScopeDispose, reactive, ref } from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type { ExtractionStatus, PaperResponse } from '@/types/api'
import {
  bulkAborted,
  bulkFail,
  bulkSkip,
  bulkSuccess,
  runBulk,
  toDisplayRows,
  type BulkDisplayRow,
  type BulkItemResult,
  type BulkOutcome,
} from '@/utils/bulkRunner'

export type PaperBulkAction = 'delete' | 'link' | 'unlink'

export type PaperBulkRun = Array<BulkItemResult<string, null>>

type PaperBulkContext =
  | { action: 'delete' }
  | { action: 'link'; projectId: string }
  | { action: 'unlink'; projectId: string }

/** batch-get caps its page size, so wide selections are verified in chunks. */
const ELIGIBILITY_CHUNK = 100

/** Deleting a paper that is still queued or being parsed would strand the pipeline. */
function canDeletePaper(status: ExtractionStatus): boolean {
  return status !== 'PENDING' && status !== 'PROCESSING'
}

/**
 * Runs delete/link/unlink over a set of paper ids. Eligibility comes from a
 * fresh batch-get: papers missing from the response (already deleted) are
 * skipped, link/unlink check the current project link, and delete refuses
 * papers that are still pending or processing. A failing batch-get chunk only
 * fails its own ids; other chunks are still verified and executed.
 */
export function usePaperBulkActions() {
  const running = ref(false)
  const results = ref<PaperBulkRun>([])
  const controller = new AbortController()

  onScopeDispose(() => {
    controller.abort()
  })

  const rows = computed<BulkDisplayRow[]>(() => toDisplayRows(results.value, (paperId) => paperId))

  interface Eligibility {
    existing: Map<string, PaperResponse>
    chunkFailures: Map<string, string>
  }

  /**
   * A failing chunk only fails its own ids; later chunks still get verified, and
   * the batch keeps running for every id that could be checked.
   */
  async function fetchEligibility(paperIds: string[]): Promise<Eligibility> {
    const existing = new Map<string, PaperResponse>()
    const chunkFailures = new Map<string, string>()
    for (let start = 0; start < paperIds.length; start += ELIGIBILITY_CHUNK) {
      if (controller.signal.aborted) return { existing, chunkFailures }
      const chunk = paperIds.slice(start, start + ELIGIBILITY_CHUNK)
      try {
        const payload = await api.batchGetPapers(chunk, 0, chunk.length)
        for (const paper of payload.items) {
          existing.set(paper.paper_id, paper)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : translate('bulk.errors.batchGetPapers')
        for (const paperId of chunk) chunkFailures.set(paperId, message)
      }
    }
    return { existing, chunkFailures }
  }

  async function perform(
    context: PaperBulkContext,
    paperId: string,
    eligibility: Eligibility,
  ): Promise<BulkOutcome<null>> {
    const chunkFailure = eligibility.chunkFailures.get(paperId)
    if (chunkFailure !== undefined) return bulkFail(chunkFailure)
    if (controller.signal.aborted) return bulkAborted()

    const paper = eligibility.existing.get(paperId)
    if (!paper) return bulkSkip('missing')

    if (context.action === 'delete') {
      if (!canDeletePaper(paper.extraction_status)) return bulkSkip('status-mismatch')
      await api.deletePaper(paperId)
      return bulkSuccess<null>(null)
    }

    const linked = paper.project_ids.includes(context.projectId)
    if (context.action === 'link') {
      if (linked) return bulkSkip('already-linked')
      await api.linkProjectPaper(context.projectId, paperId)
      return bulkSuccess<null>(null)
    }
    if (!linked) return bulkSkip('not-linked')
    await api.unlinkProjectPaper(context.projectId, paperId)
    return bulkSuccess<null>(null)
  }

  async function execute(
    context: PaperBulkContext,
    paperIds: string[],
  ): Promise<PaperBulkRun | null> {
    if (running.value || paperIds.length === 0) return null
    running.value = true
    results.value = []
    try {
      const eligibility = await fetchEligibility(paperIds)
      if (controller.signal.aborted) return []

      const outcome = await runBulk(paperIds, (paperId) => perform(context, paperId, eligibility), {
        signal: controller.signal,
      })
      if (controller.signal.aborted) return outcome
      results.value = outcome
      return outcome
    } finally {
      running.value = false
    }
  }

  function deletePapers(paperIds: string[]): Promise<PaperBulkRun | null> {
    return execute({ action: 'delete' }, paperIds)
  }

  function linkPapersToProject(
    projectId: string,
    paperIds: string[],
  ): Promise<PaperBulkRun | null> {
    return execute({ action: 'link', projectId }, paperIds)
  }

  function unlinkPapersFromProject(
    projectId: string,
    paperIds: string[],
  ): Promise<PaperBulkRun | null> {
    return execute({ action: 'unlink', projectId }, paperIds)
  }

  function clearResults(): void {
    results.value = []
  }

  return reactive({
    running,
    results,
    rows,
    deletePapers,
    linkPapersToProject,
    unlinkPapersFromProject,
    clearResults,
  })
}
