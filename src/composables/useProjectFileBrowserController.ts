import { computed, onScopeDispose, reactive, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import { useDialog } from '@/composables/useDialog'
import { useNotify } from '@/composables/useNotify'
import type { ProjectFileItem } from '@/types/api'

export type ProjectFileBrowserSelectedFile = {
  filePath: string
  content: string
  isMarkdown: boolean
}
export type ProjectFileExportFormat = 'markdown' | 'docx' | 'pdf' | 'html'
export type ProjectFileTreeNode = ProjectFileItem & {
  path: string
  children: ProjectFileTreeNode[] | null
  expanded: boolean
  loading: boolean
  error: string | null
}
export type ProjectFileTreeRow = { node: ProjectFileTreeNode; depth: number }
export type ProjectFileUploadResult = {
  name: string
  status: 'success' | 'failed' | 'skipped'
  reason: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['md', 'txt', 'json', 'csv', 'yaml', 'yml', 'toml'])

export function joinProjectFilePath(directory: string, name: string): string {
  return `${directory === '/' ? '' : directory}/${name}`
}

function parentDirectory(path: string): string {
  return path.slice(0, path.lastIndexOf('/')) || '/'
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function useProjectFileBrowserController(projectId: Ref<string>) {
  const { t } = useI18n()
  const notify = useNotify()
  const dialog = useDialog()
  const currentDir = ref('/')
  const root = reactive<ProjectFileTreeNode>({
    name: '/',
    path: '/',
    is_dir: true,
    size: null,
    children: null,
    expanded: true,
    loading: false,
    error: null,
  })
  const selectedFile = ref<ProjectFileBrowserSelectedFile | null>(null)
  const loading = ref(false)
  const busy = ref(false)
  const error = ref<string | null>(null)
  const editMode = ref(false)
  const editContent = ref('')
  const createMode = ref(false)
  const createDirMode = ref(false)
  const newFileName = ref('')
  const newFileContent = ref('')
  const newDirName = ref('')
  const exportLoading = ref(false)
  const downloadLoading = ref(false)
  const uploadResults = ref<ProjectFileUploadResult[]>([])
  let generation = 0
  let fileRequest = 0
  let pendingDecision: Promise<boolean> | null = null
  const directoryRequests = new Map<string, number>()

  const dirty = computed(
    () =>
      (editMode.value && editContent.value !== selectedFile.value?.content) ||
      (createMode.value && Boolean(newFileName.value || newFileContent.value)) ||
      (createDirMode.value && Boolean(newDirName.value)),
  )
  const rows = computed(() => {
    const result: ProjectFileTreeRow[] = []
    function visit(nodes: ProjectFileTreeNode[], depth: number): void {
      for (const node of nodes) {
        result.push({ node, depth })
        if (node.expanded && node.children) visit(node.children, depth + 1)
      }
    }
    visit(root.children ?? [], 0)
    return result
  })
  const breadcrumbs = computed(() => {
    let path = ''
    return [
      { label: t('paper.fileBrowser.root'), path: '/' },
      ...currentDir.value
        .split('/')
        .filter(Boolean)
        .map((part) => {
          path += `/${part}`
          return { label: part, path }
        }),
    ]
  })

  function findDirectory(path: string): ProjectFileTreeNode | undefined {
    if (path === '/') return root
    let node: ProjectFileTreeNode = root
    for (const part of path.split('/').filter(Boolean)) {
      const child = node.children?.find((entry) => entry.is_dir && entry.name === part)
      if (!child) return undefined
      node = child
    }
    return node
  }

  async function loadDirectory(node: ProjectFileTreeNode): Promise<boolean> {
    const owner = generation
    const pid = projectId.value
    const request = (directoryRequests.get(node.path) ?? 0) + 1
    directoryRequests.set(node.path, request)
    node.loading = true
    node.error = null
    try {
      const response = await api.listProjectFiles(pid, node.path)
      if (owner !== generation || directoryRequests.get(node.path) !== request) return false
      // Keep loaded child directories when refreshing their parent, so navigation is stable.
      const previous = new Map(node.children?.map((child) => [child.path, child]) ?? [])
      node.children = response.items
        .map((item) => {
          const path = joinProjectFilePath(node.path, item.name)
          const existing = previous.get(path)
          return existing && existing.is_dir === item.is_dir
            ? Object.assign(existing, item)
            : { ...item, path, children: null, expanded: false, loading: false, error: null }
        })
        .sort((a, b) => Number(b.is_dir) - Number(a.is_dir) || a.name.localeCompare(b.name))
      return true
    } catch (err) {
      if (owner === generation && directoryRequests.get(node.path) === request) {
        node.error = err instanceof Error ? err.message : t('projects.errors.requestFailed')
      }
      return false
    } finally {
      if (owner === generation && directoryRequests.get(node.path) === request) node.loading = false
    }
  }

  async function loadFiles(): Promise<boolean> {
    const directory = findDirectory(currentDir.value) ?? root
    return loadDirectory(directory)
  }

  function resetModes(): void {
    editMode.value = false
    createMode.value = false
    createDirMode.value = false
  }

  async function ensureCanLeave(): Promise<boolean> {
    if (busy.value) return false
    if (!dirty.value) return true
    if (pendingDecision) return pendingDecision
    const owner = generation
    pendingDecision = (async () => {
      const result = await dialog.choose({
        title: t('projects.fileBrowser.unsavedTitle'),
        message: t('projects.fileBrowser.unsavedMessage'),
        confirmText: t('projects.actions.save'),
        secondaryText: t('projects.fileBrowser.discard'),
        cancelText: t('projects.actions.cancel'),
      })
      if (owner !== generation || result === 'cancel') return false
      if (result === 'secondary') {
        resetModes()
        editContent.value = selectedFile.value?.content ?? ''
        return true
      }
      if (editMode.value) return confirmEdit()
      if (createMode.value) return confirmCreate()
      return confirmCreateDir()
    })()
    try {
      return await pendingDecision
    } finally {
      pendingDecision = null
    }
  }

  async function navigateToDir(path: string): Promise<void> {
    if (busy.value) return
    currentDir.value = path
    const node = findDirectory(path)
    if (!node) return
    node.expanded = true
    if (node.children === null || node.error) await loadDirectory(node)
  }

  async function toggleDirectory(node: ProjectFileTreeNode): Promise<void> {
    if (busy.value) return
    currentDir.value = node.path
    node.expanded = !node.expanded
    if (node.expanded && (node.children === null || node.error)) await loadDirectory(node)
  }

  async function openFile(node: ProjectFileTreeNode): Promise<void> {
    const request = ++fileRequest
    const owner = generation
    if (!(await ensureCanLeave()) || owner !== generation || request !== fileRequest) return
    loading.value = true
    error.value = null
    try {
      const response = await api.readProjectFile(projectId.value, node.path)
      if (owner !== generation || request !== fileRequest) return
      selectedFile.value = {
        filePath: response.file_path,
        content: response.content,
        isMarkdown: node.name.toLowerCase().endsWith('.md'),
      }
      editContent.value = response.content
      currentDir.value = parentDirectory(node.path)
      resetModes()
    } catch (err) {
      if (owner === generation && request === fileRequest)
        error.value = err instanceof Error ? err.message : t('projects.errors.requestFailed')
    } finally {
      if (owner === generation && request === fileRequest) loading.value = false
    }
  }

  async function closeSelectedFile(): Promise<boolean> {
    const owner = generation
    if (!(await ensureCanLeave()) || owner !== generation) return false
    fileRequest++
    loading.value = false
    selectedFile.value = null
    resetModes()
    return true
  }

  async function startCreate(): Promise<void> {
    if (!(await closeSelectedFile())) return
    newFileName.value = ''
    newFileContent.value = ''
    createMode.value = true
  }

  async function startCreateDir(): Promise<void> {
    if (!(await closeSelectedFile())) return
    newDirName.value = ''
    createDirMode.value = true
  }

  async function confirmCreate(): Promise<boolean> {
    const name = newFileName.value.trim()
    if (!name || busy.value) return false
    const pid = projectId.value
    const owner = generation
    busy.value = true
    error.value = null
    try {
      await api.writeProjectFile(pid, {
        file_path: joinProjectFilePath(currentDir.value, name),
        content: newFileContent.value,
      })
      if (owner !== generation) return false
      createMode.value = false
      notify.push(t('projects.fileCreated', { name }), 'success', 2000)
      await loadFiles()
      return true
    } catch (err) {
      if (owner === generation)
        error.value = err instanceof Error ? err.message : t('projects.errors.requestFailed')
      return false
    } finally {
      if (owner === generation) busy.value = false
    }
  }

  async function confirmCreateDir(): Promise<boolean> {
    const name = newDirName.value.trim()
    if (!name || busy.value) return false
    const owner = generation
    const pid = projectId.value
    busy.value = true
    error.value = null
    try {
      await api.writeProjectFile(pid, {
        file_path: joinProjectFilePath(currentDir.value, name),
        content: '',
        is_dir: true,
      })
      if (owner !== generation) return false
      createDirMode.value = false
      notify.push(t('projects.dirCreated', { name }), 'success', 2000)
      await loadFiles()
      return true
    } catch (err) {
      if (owner === generation)
        error.value = err instanceof Error ? err.message : t('projects.errors.requestFailed')
      return false
    } finally {
      if (owner === generation) busy.value = false
    }
  }

  function startEdit(): void {
    if (!selectedFile.value || busy.value || loading.value) return
    editContent.value = selectedFile.value.content
    editMode.value = true
  }

  async function cancelEdit(): Promise<void> {
    if (!(await ensureCanLeave())) return
    editContent.value = selectedFile.value?.content ?? ''
    editMode.value = false
  }

  async function confirmEdit(): Promise<boolean> {
    const file = selectedFile.value
    if (!file || busy.value) return false
    const owner = generation
    const pid = projectId.value
    const content = editContent.value
    busy.value = true
    error.value = null
    try {
      await api.writeProjectFile(pid, { file_path: file.filePath, content })
      if (owner !== generation) return false
      file.content = content
      editMode.value = false
      notify.push(t('projects.fileUpdated'), 'success', 2000)
      await loadFiles()
      return true
    } catch (err) {
      if (owner === generation)
        error.value = err instanceof Error ? err.message : t('projects.errors.requestFailed')
      return false
    } finally {
      if (owner === generation) busy.value = false
    }
  }

  async function deleteFile(node: ProjectFileTreeNode): Promise<void> {
    const owner = generation
    if (!(await ensureCanLeave()) || owner !== generation) return
    const confirmed = await dialog.confirm({
      title: t('projects.actions.delete'),
      message: t(node.is_dir ? 'projects.confirmDeleteDir' : 'projects.confirmDeleteFile', {
        name: node.name,
      }),
      tone: 'danger',
    })
    if (!confirmed || owner !== generation || busy.value) return
    const pid = projectId.value
    busy.value = true
    error.value = null
    fileRequest++
    loading.value = false
    try {
      await api.deleteProjectFile(pid, node.path)
      if (owner !== generation) return
      if (selectedFile.value?.filePath === node.path) {
        selectedFile.value = null
        resetModes()
      }
      if (currentDir.value === node.path) currentDir.value = parentDirectory(node.path)
      const parent = findDirectory(parentDirectory(node.path))
      if (parent) await loadDirectory(parent)
      notify.push(
        t(node.is_dir ? 'projects.dirDeleted' : 'projects.fileDeleted', { name: node.name }),
        'success',
        2000,
      )
    } catch (err) {
      if (owner === generation)
        error.value = err instanceof Error ? err.message : t('projects.errors.requestFailed')
    } finally {
      if (owner === generation) busy.value = false
    }
  }

  async function uploadFiles(files: File[]): Promise<void> {
    const owner = generation
    if (!files.length || !(await ensureCanLeave()) || owner !== generation || busy.value) return
    const pid = projectId.value
    const directory = findDirectory(currentDir.value) ?? root
    busy.value = true
    uploadResults.value = []
    fileRequest++
    loading.value = false
    try {
      if (!(await loadDirectory(directory)) || owner !== generation) return
      const existing = new Map(directory.children?.map((node) => [node.name, node]) ?? [])
      for (const file of files) {
        if (owner !== generation) break
        let reason = ''
        let status: ProjectFileUploadResult['status'] = 'failed'
        const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
        if (!ALLOWED_EXTENSIONS.has(extension)) reason = t('projects.fileBrowser.invalidExtension')
        else if (file.size > MAX_FILE_SIZE) reason = t('projects.fileBrowser.tooLarge')
        else if (existing.get(file.name)?.is_dir)
          reason = t('projects.fileBrowser.directoryConflict')
        else {
          let overwrite = true
          if (existing.has(file.name))
            overwrite = await dialog.confirm({
              title: t('projects.fileBrowser.overwriteTitle'),
              message: t('projects.fileBrowser.overwriteMessage', { name: file.name }),
              confirmText: t('projects.fileBrowser.overwrite'),
              cancelText: t('projects.fileBrowser.skip'),
            })
          if (owner !== generation) break
          if (!overwrite) {
            status = 'skipped'
            reason = t('projects.fileBrowser.skip')
          } else {
            const path = joinProjectFilePath(directory.path, file.name)
            try {
              await api.uploadProjectFile(pid, path, file)
              if (owner !== generation) break
              status = 'success'
              existing.set(file.name, {
                name: file.name,
                path,
                is_dir: false,
                size: file.size,
                children: null,
                expanded: false,
                loading: false,
                error: null,
              })
              if (selectedFile.value?.filePath === path) {
                selectedFile.value = null
                resetModes()
              }
            } catch (err) {
              reason = err instanceof Error ? err.message : t('projects.errors.requestFailed')
            }
          }
        }
        if (owner === generation) uploadResults.value.push({ name: file.name, status, reason })
      }
      if (owner === generation) await loadDirectory(directory)
    } finally {
      if (owner === generation) busy.value = false
    }
  }

  async function downloadFile(node: ProjectFileTreeNode): Promise<void> {
    if (downloadLoading.value) return
    const owner = generation
    downloadLoading.value = true
    try {
      const blob = await api.downloadProjectFile(projectId.value, node.path)
      if (owner === generation) saveBlob(blob, node.name)
    } catch (err) {
      if (owner === generation)
        error.value = err instanceof Error ? err.message : t('projects.errors.requestFailed')
    } finally {
      if (owner === generation) downloadLoading.value = false
    }
  }

  async function exportFile(format: ProjectFileExportFormat): Promise<void> {
    const file = selectedFile.value
    if (!file || exportLoading.value) return
    const owner = generation
    exportLoading.value = true
    try {
      const blob = await api.exportProjectFile(projectId.value, {
        file_path: file.filePath,
        format,
      })
      if (owner !== generation) return
      const extension = format === 'markdown' ? 'md' : format
      saveBlob(blob, `${file.filePath.split('/').pop()?.replace(/\.md$/i, '')}.${extension}`)
      notify.push(t('projects.fileExported', { format: format.toUpperCase() }), 'success', 2000)
    } catch (err) {
      if (owner === generation)
        error.value = err instanceof Error ? err.message : t('projects.errors.requestFailed')
    } finally {
      if (owner === generation) exportLoading.value = false
    }
  }

  watch(
    projectId,
    () => {
      generation++
      fileRequest++
      directoryRequests.clear()
      currentDir.value = '/'
      root.children = null
      root.expanded = true
      selectedFile.value = null
      resetModes()
      busy.value = false
      loading.value = false
      downloadLoading.value = false
      exportLoading.value = false
      error.value = null
      uploadResults.value = []
      void loadDirectory(root)
    },
    { immediate: true },
  )
  onScopeDispose(() => {
    generation++
    fileRequest++
  })

  return reactive({
    currentDir,
    root,
    rows,
    loading,
    busy,
    error,
    selectedFile,
    editMode,
    editContent,
    createMode,
    createDirMode,
    newFileName,
    newFileContent,
    newDirName,
    dirty,
    exportLoading,
    downloadLoading,
    uploadResults,
    breadcrumbs,
    loadFiles,
    loadDirectory,
    navigateToDir,
    toggleDirectory,
    openFile,
    startCreate,
    startCreateDir,
    confirmCreate,
    confirmCreateDir,
    startEdit,
    cancelEdit,
    confirmEdit,
    deleteFile,
    uploadFiles,
    downloadFile,
    exportFile,
    closeSelectedFile,
    ensureCanLeave,
  })
}
