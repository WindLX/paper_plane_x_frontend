import { createI18n } from 'vue-i18n'

import { messages } from './messages'

export type AppLocale = keyof typeof messages

const DEFAULT_LOCALE: AppLocale = 'zh-CN'
const STORAGE_KEY = 'ppx-console-locale'

function isSupportedLocale(locale: string | null | undefined): locale is AppLocale {
  return locale === 'zh-CN' || locale === 'en-US'
}

function resolveInitialLocale(): AppLocale {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
  if (isSupportedLocale(saved)) {
    return saved
  }
  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

export function setAppLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, locale)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

export function translate(key: string, params?: Record<string, unknown>): string {
  return i18n.global.t(key, params ?? {})
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.global.locale.value
}
