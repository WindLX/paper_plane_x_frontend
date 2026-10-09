import { appConfig } from '../config'
import { translate } from '../i18n'

export const API_BASE_URL = appConfig.apiBaseUrl

export class ApiError extends Error {
  readonly status: number
  readonly resourceIssues: ApiResourceIssue[]
  constructor(status: number, message: string, resourceIssues: ApiResourceIssue[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.resourceIssues = resourceIssues
  }
}

export interface ApiResourceIssue {
  reference: string
  reason: string
}

async function responseError(response: Response): Promise<ApiError> {
  const text = await response.text()
  const defaultMessage = translate('errors.requestFailed', { status: response.status })
  if (!response.headers.get('Content-Type')?.includes('application/json'))
    return new ApiError(response.status, text || defaultMessage)
  const payload: unknown = JSON.parse(text)
  if (typeof payload !== 'object' || payload === null || !('detail' in payload))
    return new ApiError(response.status, defaultMessage)
  const detail = payload.detail
  if (typeof detail === 'string') return new ApiError(response.status, detail)
  if (typeof detail !== 'object' || detail === null || !('message' in detail))
    return new ApiError(response.status, defaultMessage)
  const issues: ApiResourceIssue[] = []
  if (
    'details' in detail &&
    typeof detail.details === 'object' &&
    detail.details !== null &&
    'references' in detail.details &&
    Array.isArray(detail.details.references)
  ) {
    for (const reference of detail.details.references as unknown[]) {
      if (
        typeof reference === 'object' &&
        reference !== null &&
        'reference' in reference &&
        'reason' in reference &&
        typeof reference.reference === 'string' &&
        typeof reference.reason === 'string'
      )
        issues.push({ reference: reference.reference, reason: reference.reason })
    }
  }
  return new ApiError(
    response.status,
    typeof detail.message === 'string' ? detail.message : defaultMessage,
    issues,
  )
}

export interface BlobTransferProgress {
  received: number
  total: number | null
}

export interface BlobTransferOptions {
  signal?: AbortSignal
  onResponse?: () => void
  onProgress?: (progress: BlobTransferProgress) => void
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!response.ok) {
    throw await responseError(response)
  }
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function requestBlob(
  path: string,
  init?: RequestInit,
  transfer?: BlobTransferOptions,
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
    ...(transfer?.signal ? { signal: transfer.signal } : {}),
  })
  if (!response.ok) {
    throw await responseError(response)
  }
  transfer?.onResponse?.()
  if (!transfer?.onProgress || !response.body) return await response.blob()
  const length = response.headers.get('Content-Length')
  const size = length === null ? null : Number(length)
  const total = size !== null && Number.isFinite(size) && size >= 0 ? size : null
  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let received = 0
  transfer.onProgress({ received, total })
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(new Uint8Array(value))
      received += value.byteLength
      transfer.onProgress({ received, total })
    }
  } finally {
    reader.releaseLock()
  }
  return new Blob(chunks, { type: response.headers.get('Content-Type') ?? '' })
}
