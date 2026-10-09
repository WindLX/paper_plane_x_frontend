/**
 * Pure helpers for project sandbox files that may be text (the editable
 * research artifacts) or images (binary previews served through the backend
 * preview endpoint). The project file list is allowed to omit `kind`, so the
 * extension is always used as a fallback. Nothing here touches the DOM or the
 * API layer so the rules stay unit-testable and reusable by the controller and
 * the Markdown renderer.
 */

export type ProjectFileKind = 'directory' | 'text' | 'image'

/** Image extensions accepted for upload and preview. */
export const PROJECT_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] as const

/** Text extensions accepted for upload and in-place editing. */
export const PROJECT_TEXT_EXTENSIONS = ['md', 'txt', 'json', 'csv', 'yaml', 'yml', 'toml'] as const

/** Shared upload ceiling for both text and image project files. */
export const PROJECT_FILE_MAX_SIZE = 10 * 1024 * 1024

/** Minimal structural shape needed to classify a project file entry. */
export interface ProjectFileKindSource {
  name: string
  is_dir?: boolean
  kind?: ProjectFileKind | null
}

/** Returns the lowercase extension of the last path segment, or '' when absent. */
export function fileExtension(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1).trim()
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase()
}

export function isImagePath(path: string): boolean {
  return (PROJECT_IMAGE_EXTENSIONS as readonly string[]).includes(fileExtension(path))
}

export function isTextPath(path: string): boolean {
  return (PROJECT_TEXT_EXTENSIONS as readonly string[]).includes(fileExtension(path))
}

export function isSupportedProjectFilePath(path: string): boolean {
  return isImagePath(path) || isTextPath(path)
}

/**
 * Prefers the backend-provided `kind`, then falls back to the extension. A
 * directory always wins so a stray `kind` cannot misclassify a folder entry.
 */
export function resolveProjectFileKind(source: ProjectFileKindSource): ProjectFileKind {
  if (source.is_dir) return 'directory'
  if (source.kind === 'directory' || source.kind === 'text' || source.kind === 'image') {
    return source.kind
  }
  return isImagePath(source.name) ? 'image' : 'text'
}

export type ProjectImageResolution =
  | { status: 'remote'; url: string }
  | { status: 'resolved'; path: string }
  | { status: 'invalid'; path: string; reason: 'empty' | 'escaped' }

// Any scheme (`http:`, `https:`, `data:`, `mailto:`) or a protocol-relative
// reference is treated as an external source and left untouched so images that
// already point at the network keep rendering exactly as before.
const REMOTE_SOURCE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

export function isRemoteImageSource(source: string): boolean {
  return REMOTE_SOURCE.test(source.trim())
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    // A malformed percent sequence is most likely a literal filename, so keep it.
    return value
  }
}

function directorySegments(filePath: string): string[] {
  const segments = filePath.split('/').filter(Boolean)
  segments.pop()
  return segments
}

/**
 * Normalises a route- or API-supplied project path to a root-anchored path.
 * Returns `null` for empty, remote, or root-escaping values so deep links
 * cannot point outside the sandbox.
 */
export function normalizeProjectFilePath(rawPath: string): string | null {
  const source = rawPath.trim()
  if (!source || isRemoteImageSource(source)) return null
  const withoutFragment = source.split('#')[0] ?? ''
  const decoded = decodePath(withoutFragment.split('?')[0] ?? '').trim()
  if (!decoded) return null
  const stack: string[] = []
  for (const segment of decoded.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      if (!stack.length) return null
      stack.pop()
      continue
    }
    stack.push(segment)
  }
  if (!stack.length) return null
  return `/${stack.join('/')}`
}

/**
 * Resolves an image reference found inside a Markdown artifact to a path
 * relative to the project sandbox root.
 *
 * - `http(s):`, `data:`, `mailto:` and `//host` sources stay remote.
 * - Root-relative `/x.png` resolves from the project root.
 * - `./`, `..` and bare names resolve from the Markdown file's directory
 *   (nested artifacts such as `/notes/draft.md` keep local images working).
 * - Percent-encoded and raw unicode/spaces are decoded before traversal, and a
 *   path that walks above the root is reported as `escaped` before any URL is
 *   built so a broken or unsafe request is never issued.
 */
export function resolveProjectImagePath(
  markdownFilePath: string,
  rawSource: string,
): ProjectImageResolution {
  const source = rawSource.trim()
  if (!source) return { status: 'invalid', path: source, reason: 'empty' }
  if (isRemoteImageSource(source)) return { status: 'remote', url: source }

  const withoutFragment = source.split('#')[0] ?? ''
  const withoutQuery = withoutFragment.split('?')[0] ?? ''
  const decoded = decodePath(withoutQuery).trim()
  if (!decoded || decoded === '.') return { status: 'invalid', path: source, reason: 'empty' }

  const rootRelative = decoded.startsWith('/')
  const segments = rootRelative ? decoded.replace(/^\/+/, '').split('/') : decoded.split('/')
  const stack = rootRelative ? [] : directorySegments(markdownFilePath)

  for (const segment of segments) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      if (!stack.length) return { status: 'invalid', path: decoded, reason: 'escaped' }
      stack.pop()
      continue
    }
    stack.push(segment)
  }

  if (!stack.length) return { status: 'invalid', path: decoded, reason: 'empty' }
  return { status: 'resolved', path: `/${stack.join('/')}` }
}
