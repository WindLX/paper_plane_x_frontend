/**
 * Bounded-concurrency runner for "select many → act on each" flows.
 *
 * The runner owns scheduling only: it runs a worker per item with at most
 * `concurrency` in flight, never throws, and reports one outcome per item.
 * Eligibility checks, HTTP calls, and refresh logic stay in the caller so the
 * same runner can serve tasks, library papers, and project papers. When the
 * caller aborts the signal, dispatch stops and in-flight items are dropped, so
 * an unmounted page cannot keep starting new writes.
 */

export type BulkItemStatus = 'success' | 'failed' | 'skipped'

/** Aborted work is dropped from the results instead of being reported to the user. */
export type BulkOutcomeStatus = BulkItemStatus | 'aborted'

export type BulkSkipCode = 'missing' | 'already-linked' | 'not-linked' | 'status-mismatch'

export interface BulkIneligibleReason {
  kind: 'ineligible'
  code: BulkSkipCode
}

export interface BulkErrorReason {
  kind: 'error'
  message: string
}

export type BulkReason = BulkIneligibleReason | BulkErrorReason

export interface BulkOutcome<TResult> {
  status: BulkOutcomeStatus
  result?: TResult
  reason?: BulkReason
}

export interface BulkItemResult<TItem, TResult> {
  item: TItem
  status: BulkItemStatus
  result: TResult | null
  reason: BulkReason | null
}

export interface BulkRunOptions {
  concurrency?: number
  /** When aborted, no further items are dispatched and in-flight work is dropped. */
  signal?: AbortSignal
}

/** Selected sets stay small; three in-flight requests keeps bursts gentle on the backend. */
export const DEFAULT_BULK_CONCURRENCY = 3

export function bulkSuccess<TResult>(result?: TResult): BulkOutcome<TResult> {
  return result === undefined ? { status: 'success' } : { status: 'success', result }
}

export function bulkSkip<TResult>(code: BulkSkipCode): BulkOutcome<TResult> {
  return { status: 'skipped', reason: { kind: 'ineligible', code } }
}

export function bulkFail<TResult>(message: string): BulkOutcome<TResult> {
  return { status: 'failed', reason: { kind: 'error', message } }
}

export function bulkAborted<TResult>(): BulkOutcome<TResult> {
  return { status: 'aborted' }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function runBulk<TItem, TResult>(
  items: TItem[],
  worker: (item: TItem) => Promise<BulkOutcome<TResult>>,
  options: BulkRunOptions = {},
): Promise<Array<BulkItemResult<TItem, TResult>>> {
  const requested = options.concurrency ?? DEFAULT_BULK_CONCURRENCY
  const concurrency = Math.max(1, Math.floor(requested))
  const outcomes: Array<BulkItemResult<TItem, TResult> | undefined> = new Array(items.length)
  let cursor = 0

  async function lane(): Promise<void> {
    for (;;) {
      if (options.signal?.aborted) return
      // Claim the next item synchronously so two lanes never share an index.
      const index = cursor
      cursor += 1
      if (index >= items.length) return

      const item = items[index]
      try {
        const outcome = await worker(item)
        // The worker gave up mid-flight (for example the page was unmounted).
        if (outcome.status === 'aborted') return
        outcomes[index] = {
          item,
          status: outcome.status,
          result: outcome.result ?? null,
          reason: outcome.reason ?? null,
        }
      } catch (error) {
        outcomes[index] = {
          item,
          status: 'failed',
          result: null,
          reason: { kind: 'error', message: toErrorMessage(error) },
        }
      }
    }
  }

  const laneCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: laneCount }, () => lane()))

  return outcomes.filter((entry): entry is BulkItemResult<TItem, TResult> => entry !== undefined)
}

export interface BulkDisplayRow {
  id: string
  status: BulkItemStatus
  reason: BulkReason | null
  extra: string | null
}

/** Flattens runner output into rows the result panel can render without domain types. */
export function toDisplayRows<TItem, TResult>(
  results: Array<BulkItemResult<TItem, TResult>>,
  toId: (item: TItem) => string,
  toExtra?: (entry: BulkItemResult<TItem, TResult>) => string | null,
): BulkDisplayRow[] {
  return results.map((entry) => ({
    id: toId(entry.item),
    status: entry.status,
    reason: entry.reason,
    extra: toExtra ? toExtra(entry) : null,
  }))
}
