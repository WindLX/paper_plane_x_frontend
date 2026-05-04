import { appConfig } from '../config'
import { translate } from '../i18n'

export const API_BASE_URL = appConfig.apiBaseUrl

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || translate('errors.requestFailed', { status: response.status }))
  }
  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || translate('errors.requestFailed', { status: response.status }))
  }
  return await response.blob()
}
