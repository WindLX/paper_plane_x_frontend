import { effectScope, ref, type EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useProjectFileBrowserController,
  type ProjectFileTreeNode,
} from './useProjectFileBrowserController'

const mocks = vi.hoisted(() => ({
  listProjectFiles: vi.fn(),
  readProjectFile: vi.fn(),
  writeProjectFile: vi.fn(),
  deleteProjectFile: vi.fn(),
  uploadProjectFile: vi.fn(),
  downloadProjectFile: vi.fn(),
  exportProjectFile: vi.fn(),
  choose: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('@/api', () => ({ api: mocks }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('./useDialog', () => ({
  useDialog: () => ({ choose: mocks.choose, confirm: mocks.confirm }),
}))
vi.mock('./useNotify', () => ({ useNotify: () => ({ push: mocks.notify }) }))

const scopes: EffectScope[] = []
function browser() {
  const scope = effectScope()
  scopes.push(scope)
  const pid = ref('project-one')
  const ctrl = scope.run(() => useProjectFileBrowserController(pid))!
  return { ctrl, pid, scope }
}
function node(name: string, directory = false): ProjectFileTreeNode {
  return {
    name,
    path: `/${name}`,
    is_dir: directory,
    size: directory ? null : 10,
    children: null,
    expanded: false,
    loading: false,
    error: null,
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.listProjectFiles.mockResolvedValue({ items: [] })
  mocks.readProjectFile.mockImplementation(async (_pid: string, path: string) => ({
    file_path: path,
    content: `content of ${path}`,
  }))
  mocks.writeProjectFile.mockResolvedValue({})
  mocks.uploadProjectFile.mockResolvedValue({})
  mocks.confirm.mockResolvedValue(true)
  mocks.choose.mockResolvedValue('cancel')
})
afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop()
})

describe('project file tree and editing', () => {
  it('loads only expanded directories and retains their children on parent refresh', async () => {
    mocks.listProjectFiles.mockImplementation(async (_pid: string, path: string) => ({
      items:
        path === '/'
          ? [{ name: 'notes', is_dir: true, size: null }]
          : [{ name: 'draft.md', is_dir: false, size: 10 }],
    }))
    const { ctrl } = browser()
    await vi.waitFor(() => expect(ctrl.rows).toHaveLength(1))
    const directory = ctrl.rows[0]!.node
    expect(mocks.listProjectFiles).toHaveBeenCalledTimes(1)
    await ctrl.toggleDirectory(directory)
    expect(ctrl.rows.map((row) => row.node.path)).toEqual(['/notes', '/notes/draft.md'])
    await ctrl.toggleDirectory(directory)
    await ctrl.toggleDirectory(directory)
    expect(mocks.listProjectFiles).toHaveBeenCalledTimes(2)
    await ctrl.loadDirectory(ctrl.root)
    expect(ctrl.rows).toHaveLength(2)
  })

  it('uses the last clicked file when responses arrive in reverse order', async () => {
    const first = deferred<{ file_path: string; content: string }>()
    const second = deferred<{ file_path: string; content: string }>()
    mocks.readProjectFile.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { ctrl } = browser()
    const a = ctrl.openFile(node('a.json'))
    await vi.waitFor(() => expect(mocks.readProjectFile).toHaveBeenCalledTimes(1))
    const b = ctrl.openFile(node('b.json'))
    await vi.waitFor(() => expect(mocks.readProjectFile).toHaveBeenCalledTimes(2))
    second.resolve({ file_path: '/b.json', content: 'B' })
    await b
    first.resolve({ file_path: '/a.json', content: 'A' })
    await a
    expect(ctrl.selectedFile?.filePath).toBe('/b.json')
    expect(ctrl.selectedFile?.content).toBe('B')
  })

  it('cancels navigation with unsaved changes, then supports discard', async () => {
    const { ctrl } = browser()
    await ctrl.openFile(node('draft.md'))
    ctrl.startEdit()
    ctrl.editContent = 'unsaved'
    await ctrl.openFile(node('other.txt'))
    expect(ctrl.selectedFile?.filePath).toBe('/draft.md')
    expect(ctrl.editContent).toBe('unsaved')
    mocks.choose.mockResolvedValue('secondary')
    await ctrl.openFile(node('other.txt'))
    expect(ctrl.selectedFile?.filePath).toBe('/other.txt')
    expect(mocks.writeProjectFile).not.toHaveBeenCalled()
  })

  it('saves before leaving, but stays on the draft if saving fails', async () => {
    const { ctrl } = browser()
    await ctrl.openFile(node('draft.md'))
    ctrl.startEdit()
    ctrl.editContent = 'updated'
    mocks.choose.mockResolvedValue('confirm')
    mocks.writeProjectFile.mockRejectedValueOnce(new Error('save failed'))
    expect(await ctrl.ensureCanLeave()).toBe(false)
    expect(ctrl.dirty).toBe(true)
    expect(ctrl.error).toBe('save failed')
    expect(await ctrl.ensureCanLeave()).toBe(true)
    expect(mocks.writeProjectFile).toHaveBeenLastCalledWith('project-one', {
      file_path: '/draft.md',
      content: 'updated',
    })
    expect(ctrl.selectedFile?.content).toBe('updated')
    expect(ctrl.dirty).toBe(false)
  })

  it('protects new-file and new-directory drafts too', async () => {
    const { ctrl } = browser()
    await ctrl.startCreate()
    ctrl.newFileName = 'note.md'
    ctrl.newFileContent = 'draft'
    expect(await ctrl.closeSelectedFile()).toBe(false)
    expect(ctrl.createMode).toBe(true)
    mocks.choose.mockResolvedValue('secondary')
    await ctrl.startCreateDir()
    ctrl.newDirName = 'notes'
    mocks.choose.mockResolvedValue('confirm')
    expect(await ctrl.ensureCanLeave()).toBe(true)
    expect(mocks.writeProjectFile).toHaveBeenLastCalledWith('project-one', {
      file_path: '/notes',
      content: '',
      is_dir: true,
    })
  })

  it('does not apply reads after project changes or scope disposal', async () => {
    const pending = deferred<{ file_path: string; content: string }>()
    mocks.readProjectFile.mockReturnValueOnce(pending.promise)
    const { ctrl, pid, scope } = browser()
    const opening = ctrl.openFile(node('old.md'))
    await vi.waitFor(() => expect(mocks.readProjectFile).toHaveBeenCalledTimes(1))
    pid.value = 'project-two'
    await vi.waitFor(() => expect(mocks.listProjectFiles).toHaveBeenCalledWith('project-two', '/'))
    pending.resolve({ file_path: '/old.md', content: 'stale' })
    await opening
    expect(ctrl.selectedFile).toBeNull()
    const next = deferred<{ file_path: string; content: string }>()
    mocks.readProjectFile.mockReturnValueOnce(next.promise)
    const disposed = ctrl.openFile(node('disposed.md'))
    await vi.waitFor(() => expect(mocks.readProjectFile).toHaveBeenCalledTimes(2))
    scope.stop()
    next.resolve({ file_path: '/disposed.md', content: 'stale' })
    await disposed
    expect(ctrl.selectedFile).toBeNull()
  })
})

describe('project file uploads and deletion', () => {
  it('does not reopen a deleted file from an earlier pending read', async () => {
    const pending = deferred<{ file_path: string; content: string }>()
    mocks.readProjectFile.mockReturnValueOnce(pending.promise)
    mocks.deleteProjectFile.mockResolvedValue({ removed: '/old.md' })
    const { ctrl } = browser()
    const opening = ctrl.openFile(node('old.md'))
    await vi.waitFor(() => expect(mocks.readProjectFile).toHaveBeenCalledTimes(1))
    await ctrl.deleteFile(node('old.md'))
    pending.resolve({ file_path: '/old.md', content: 'deleted content' })
    await opening
    expect(ctrl.selectedFile).toBeNull()
    expect(ctrl.loading).toBe(false)
  })

  it('skips a declined overwrite, continues after failure, and records each result', async () => {
    mocks.listProjectFiles.mockResolvedValue({
      items: [{ name: 'same.json', is_dir: false, size: 10 }],
    })
    const { ctrl } = browser()
    mocks.confirm.mockResolvedValue(false)
    mocks.uploadProjectFile
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce({})
    await ctrl.uploadFiles([
      new File(['old'], 'same.json'),
      new File(['bad'], 'failed.txt'),
      new File(['ok'], 'ok.md'),
      new File(['bad'], 'bad.exe'),
    ])
    expect(ctrl.uploadResults.map((result) => result.status)).toEqual([
      'skipped',
      'failed',
      'success',
      'failed',
    ])
    expect(ctrl.uploadResults[1]?.reason).toBe('upload failed')
    expect(mocks.uploadProjectFile.mock.calls.map((call) => call[1])).toEqual([
      '/failed.txt',
      '/ok.md',
    ])
    expect(ctrl.busy).toBe(false)
  })

  it('uploads into the selected directory and confirms same-name overwrite', async () => {
    mocks.listProjectFiles.mockImplementation(async (_pid: string, path: string) => ({
      items:
        path === '/'
          ? [{ name: 'notes', is_dir: true, size: null }]
          : [{ name: 'existing.txt', is_dir: false, size: 10 }],
    }))
    const { ctrl } = browser()
    await vi.waitFor(() => expect(ctrl.rows).toHaveLength(1))
    await ctrl.toggleDirectory(ctrl.rows[0]!.node)
    await ctrl.uploadFiles([new File(['new'], 'existing.txt')])
    expect(mocks.confirm).toHaveBeenCalledTimes(1)
    expect(mocks.uploadProjectFile).toHaveBeenCalledWith(
      'project-one',
      '/notes/existing.txt',
      expect.any(File),
    )
    expect(ctrl.uploadResults[0]?.status).toBe('success')
  })

  it('does not upload if the directory cannot be refreshed', async () => {
    const { ctrl } = browser()
    mocks.listProjectFiles.mockRejectedValue(new Error('directory unavailable'))
    await ctrl.uploadFiles([new File(['x'], 'file.txt')])
    expect(mocks.uploadProjectFile).not.toHaveBeenCalled()
    expect(ctrl.root.error).toBe('directory unavailable')
    expect(ctrl.busy).toBe(false)
  })

  it('reports oversized files and directory conflicts without uploading', async () => {
    mocks.listProjectFiles.mockResolvedValue({
      items: [{ name: 'folder.txt', is_dir: true, size: null }],
    })
    const { ctrl } = browser()
    await ctrl.uploadFiles([
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.txt'),
      new File(['x'], 'folder.txt'),
    ])
    expect(ctrl.uploadResults.map((result) => result.reason)).toEqual([
      'projects.fileBrowser.tooLarge',
      'projects.fileBrowser.directoryConflict',
    ])
    expect(mocks.uploadProjectFile).not.toHaveBeenCalled()
  })

  it('uses full file paths for deletion and never sends a recursive argument', async () => {
    const { ctrl } = browser()
    mocks.deleteProjectFile.mockResolvedValue({ removed: '/notes/draft.md' })
    await ctrl.deleteFile({ ...node('draft.md'), path: '/notes/draft.md' })
    expect(mocks.deleteProjectFile).toHaveBeenCalledWith('project-one', '/notes/draft.md')
  })
})
