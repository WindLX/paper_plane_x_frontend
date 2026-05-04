export type AppConfig = {
  apiBaseUrl: string
  appVersion: string
}

export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

export function normalizeApiBaseUrl(value: string | undefined): string {
  const normalized = (value ?? DEFAULT_API_BASE_URL).trim()
  return normalized.replace(/\/+$/, '')
}

/** 读取后端 Jinja2 注入的运行时配置；开发环境未渲染时返回 undefined */
function getRuntimeConfig(): Record<string, string> | undefined {
  const el = document.getElementById('app-config')
  if (!el) return undefined
  const content = el.textContent?.trim() || ''
  // 如果 Jinja2 占位符未被替换（开发环境），直接忽略
  if (content.includes('{{') || content.includes('}}')) return undefined
  try {
    return JSON.parse(content)
  } catch {
    return undefined
  }
}

export function resolveAppConfig(source: Record<string, string | undefined>): AppConfig {
  const runtime = getRuntimeConfig()

  return {
    // 优先级：后端注入 > Vite env > 默认值
    apiBaseUrl: normalizeApiBaseUrl(runtime?.apiBaseUrl ?? source.VITE_API_BASE_URL),
    appVersion: runtime?.appVersion ?? __APP_VERSION__ ?? 'unknown',
  }
}

export const appConfig = resolveAppConfig(import.meta.env as Record<string, string | undefined>)
