import { describe, expect, it } from 'vitest'
import {
  fileExtension,
  isImagePath,
  isRemoteImageSource,
  isSupportedProjectFilePath,
  isTextPath,
  normalizeProjectFilePath,
  resolveProjectFileKind,
  resolveProjectImagePath,
} from './projectImage'

describe('project file classification', () => {
  it('reads extensions from the final path segment', () => {
    expect(fileExtension('/notes/draft.MD')).toBe('md')
    expect(fileExtension('figure.png')).toBe('png')
    expect(fileExtension('/notes/archive.tar.gz')).toBe('gz')
    expect(fileExtension('/notes/README')).toBe('')
    expect(fileExtension('/notes/.gitignore')).toBe('')
  })

  it('recognises image and text extensions', () => {
    for (const name of ['a.png', 'b.JPG', 'c.jpeg', 'd.webp', 'e.gif', 'f.svg']) {
      expect(isImagePath(name)).toBe(true)
    }
    for (const name of ['a.md', 'b.TXT', 'c.json', 'd.csv', 'e.yaml', 'f.yml', 'g.toml']) {
      expect(isTextPath(name)).toBe(true)
    }
    expect(isImagePath('a.md')).toBe(false)
    expect(isSupportedProjectFilePath('figure.webp')).toBe(true)
    expect(isSupportedProjectFilePath('script.exe')).toBe(false)
  })

  it('prefers the backend kind and infers images for old entries without one', () => {
    expect(resolveProjectFileKind({ name: 'notes', is_dir: true })).toBe('directory')
    expect(resolveProjectFileKind({ name: 'notes', is_dir: true, kind: 'text' })).toBe('directory')
    expect(resolveProjectFileKind({ name: 'data.bin', kind: 'text' })).toBe('text')
    expect(resolveProjectFileKind({ name: 'photo.avif', kind: 'image' })).toBe('image')
    // Legacy list payload without `kind` must still treat images as images.
    expect(resolveProjectFileKind({ name: 'figure.svg' })).toBe('image')
    expect(resolveProjectFileKind({ name: 'draft.md' })).toBe('text')
  })
})

describe('project image source resolution', () => {
  it('keeps network and data sources untouched', () => {
    for (const source of [
      'https://example.com/a.png',
      'http://example.com/a.png',
      '//cdn.example.com/a.png',
      'data:image/png;base64,AAAA',
    ]) {
      expect(isRemoteImageSource(source)).toBe(true)
      expect(resolveProjectImagePath('/notes/draft.md', source)).toEqual({
        status: 'remote',
        url: source,
      })
    }
    expect(isRemoteImageSource('images/a.png')).toBe(false)
  })

  it('resolves siblings, nested and root-relative paths against the markdown file', () => {
    expect(resolveProjectImagePath('/notes/draft.md', 'figure.png')).toEqual({
      status: 'resolved',
      path: '/notes/figure.png',
    })
    expect(resolveProjectImagePath('/notes/draft.md', './assets/figure.png')).toEqual({
      status: 'resolved',
      path: '/notes/assets/figure.png',
    })
    expect(resolveProjectImagePath('/notes/deep/draft.md', '../figure.png')).toEqual({
      status: 'resolved',
      path: '/notes/figure.png',
    })
    expect(resolveProjectImagePath('/notes/draft.md', '/shared/figure.png')).toEqual({
      status: 'resolved',
      path: '/shared/figure.png',
    })
    expect(resolveProjectImagePath('/notes/draft.md', 'figure.png#frag?x=1')).toEqual({
      status: 'resolved',
      path: '/notes/figure.png',
    })
  })

  it('decodes percent-encoded unicode and spaces before resolving', () => {
    expect(resolveProjectImagePath('/notes/draft.md', 'my%20image.png')).toEqual({
      status: 'resolved',
      path: '/notes/my image.png',
    })
    expect(resolveProjectImagePath('/notes/draft.md', '图%2F表%20x.png')).toEqual({
      status: 'resolved',
      path: '/notes/图/表 x.png',
    })
    expect(resolveProjectImagePath('/notes/draft.md', '图表 x.png')).toEqual({
      status: 'resolved',
      path: '/notes/图表 x.png',
    })
  })

  it('flags escapes above the project root before building a url', () => {
    expect(resolveProjectImagePath('/notes/draft.md', '../secret.png')).toEqual({
      status: 'resolved',
      path: '/secret.png',
    })
    expect(resolveProjectImagePath('/draft.md', '../secret.png')).toEqual({
      status: 'invalid',
      path: '../secret.png',
      reason: 'escaped',
    })
    // Encoding must not smuggle a traversal past the escape check.
    expect(resolveProjectImagePath('/draft.md', '%2E%2E%2Fsecret.png')).toEqual({
      status: 'invalid',
      path: '../secret.png',
      reason: 'escaped',
    })
  })

  it('reports empty sources', () => {
    expect(resolveProjectImagePath('/notes/draft.md', '   ')).toEqual({
      status: 'invalid',
      path: '',
      reason: 'empty',
    })
    expect(resolveProjectImagePath('/notes/draft.md', '#frag')).toEqual({
      status: 'invalid',
      path: '#frag',
      reason: 'empty',
    })
  })
})

describe('project path normalisation for deep links', () => {
  it('anchors relative and root-relative paths', () => {
    expect(normalizeProjectFilePath('notes/draft.md')).toBe('/notes/draft.md')
    expect(normalizeProjectFilePath('/notes/draft.md')).toBe('/notes/draft.md')
    expect(normalizeProjectFilePath('/notes/./draft.md?x=1#frag')).toBe('/notes/draft.md')
    expect(normalizeProjectFilePath('/notes/a/../draft.md')).toBe('/notes/draft.md')
  })

  it('rejects remote, empty and root-escaping paths', () => {
    expect(normalizeProjectFilePath('https://example.com/x.md')).toBeNull()
    expect(normalizeProjectFilePath('   ')).toBeNull()
    expect(normalizeProjectFilePath('../secret.md')).toBeNull()
    expect(normalizeProjectFilePath('/../secret.md')).toBeNull()
  })
})
