import { safePrettyJson } from './format'

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function renderValueInline(value: unknown): string {
  if (value == null) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return value
      .map((item) =>
        typeof item === 'string' || typeof item === 'number' ? String(item) : safePrettyJson(item),
      )
      .join(', ')
  }
  if (isPlainObject(value) && typeof value.text === 'string') {
    return value.text
  }
  return safePrettyJson(value)
}
