export type AppConfig = {
  apiBaseUrl: string
  appVersion: string
}

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

export function normalizeApiBaseUrl(value: string | undefined): string {
  const normalized = (value ?? DEFAULT_API_BASE_URL).trim()
  return normalized.replace(/\/+$/, '')
}

export function resolveAppConfig(source: Record<string, string | undefined>): AppConfig {
  return {
    apiBaseUrl: normalizeApiBaseUrl(source.VITE_API_BASE_URL),
    appVersion: __APP_VERSION__,
  }
}

export const appConfig = resolveAppConfig(import.meta.env as Record<string, string | undefined>)
