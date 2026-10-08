import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BULK_CONCURRENCY,
  bulkAborted,
  bulkFail,
  bulkSkip,
  bulkSuccess,
  runBulk,
  toDisplayRows,
  type BulkOutcome,
} from './bulkRunner'

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('runBulk', () => {
  it('defaults to three in-flight requests', () => {
    expect(DEFAULT_BULK_CONCURRENCY).toBe(3)
  })

  it('never exceeds the concurrency limit and returns results in input order', async () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const releases: Array<() => void> = []
    const started: string[] = []
    let active = 0
    let maxActive = 0

    const run = runBulk(
      items,
      async (item) => {
        started.push(item)
        active += 1
        maxActive = Math.max(maxActive, active)
        await new Promise<void>((resolve) => releases.push(resolve))
        active -= 1
        return bulkSuccess(item)
      },
      { concurrency: 3 },
    )

    // Workers run synchronously up to their first await, so three lanes start at once.
    expect(active).toBe(3)
    expect(releases).toHaveLength(3)
    expect(started).toEqual(['a', 'b', 'c'])

    // Releasing one slot starts the next item without ever exceeding the limit.
    releases.shift()?.()
    await flush()
    expect(active).toBe(3)
    expect(maxActive).toBe(3)
    expect(started).toEqual(['a', 'b', 'c', 'd'])

    while (releases.length > 0) {
      releases.splice(0).forEach((release) => release())
      await flush()
    }

    const results = await run
    expect(maxActive).toBe(3)
    expect(results.map((entry) => entry.item)).toEqual(items)
    expect(results.every((entry) => entry.status === 'success')).toBe(true)
  })

  it('isolates thrown errors as failed rows and keeps skipped rows in place', async () => {
    const items = ['ok-1', 'boom', 'ok-2', 'skip-me', 'fail-me']

    const results = await runBulk<string, string>(
      items,
      async (item): Promise<BulkOutcome<string>> => {
        if (item === 'boom') throw new Error('network down')
        if (item === 'skip-me') return bulkSkip('already-linked')
        if (item === 'fail-me') return bulkFail('chunk unavailable')
        return bulkSuccess(item)
      },
      { concurrency: 2 },
    )

    expect(results.map((entry) => entry.item)).toEqual(items)
    expect(results.map((entry) => entry.status)).toEqual([
      'success',
      'failed',
      'success',
      'skipped',
      'failed',
    ])
    expect(results[1].reason).toEqual({ kind: 'error', message: 'network down' })
    expect(results[3].reason).toEqual({ kind: 'ineligible', code: 'already-linked' })
    expect(results[4].reason).toEqual({ kind: 'error', message: 'chunk unavailable' })
    expect(results.map((entry) => entry.result)).toEqual(['ok-1', null, 'ok-2', null, null])
  })

  it('stops dispatching once the signal is aborted and drops in-flight work', async () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f']
    const controller = new AbortController()
    const releases: Array<() => void> = []
    const started: string[] = []

    const run = runBulk(
      items,
      async (item) => {
        started.push(item)
        await new Promise<void>((resolve) => releases.push(resolve))
        return controller.signal.aborted ? bulkAborted<string>() : bulkSuccess(item)
      },
      { concurrency: 3, signal: controller.signal },
    )

    expect(started).toEqual(['a', 'b', 'c'])

    controller.abort()
    releases.splice(0).forEach((release) => release())
    await flush()

    await expect(run).resolves.toEqual([])
    expect(started).toEqual(['a', 'b', 'c'])
  })

  it('keeps input order even when later items finish first', async () => {
    const items = ['slow', 'fast']
    const delays: Record<string, number> = { slow: 8, fast: 0 }

    const results = await runBulk(
      items,
      async (item) => {
        await new Promise((resolve) => setTimeout(resolve, delays[item]))
        return bulkSuccess(item)
      },
      { concurrency: 2 },
    )

    expect(results.map((entry) => entry.item)).toEqual(items)
  })

  it('handles an empty selection without scheduling work', async () => {
    const results = await runBulk([], async () => bulkSuccess())
    expect(results).toEqual([])
  })
})

describe('toDisplayRows', () => {
  it('maps ids and optional extras', async () => {
    const results = await runBulk<string, string | null>(['a', 'b'], async (item) =>
      item === 'a' ? bulkSuccess('new-a') : bulkSkip('missing'),
    )

    const rows = toDisplayRows(
      results,
      (item) => item,
      (entry) => (entry.result ? 'retried:' + entry.result : null),
    )

    expect(rows).toEqual([
      { id: 'a', status: 'success', reason: null, extra: 'retried:new-a' },
      { id: 'b', status: 'skipped', reason: { kind: 'ineligible', code: 'missing' }, extra: null },
    ])
  })
})
