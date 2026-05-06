import { computed, reactive, ref, watch, type Ref } from 'vue'
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

function isMarkdownFile(name: string): boolean {
  return name.toLowerCase().endsWith('.md')
}

export function useProjectFileBrowserController(projectId: Ref<string>) {
  const { t } = useI18n()
  const notify = useNotify()
  const dialog = useDialog()

  const currentDir = ref('/')
  const items = ref<ProjectFileItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedFile = ref<ProjectFileBrowserSelectedFile | null>(null)
  const editMode = ref(false)
  const editContent = ref('')
  const editFilePath = ref('')
  const createMode = ref(false)
  const createDirMode = ref(false)
  const newFileName = ref('')
  const newFileContent = ref('')
  const newDirName = ref('')
  const exportLoading = ref(false)
  const exportMenuOpen = ref(false)

  const breadcrumbs = computed(() => {
    const parts = currentDir.value.split('/').filter(Boolean)
    const crumbs = [{ label: t('paper.fileBrowser.root'), path: '/' }]
    let path = ''
    for (const part of parts) {
      path += `/${part}`
      crumbs.push({ label: part, path })
    }
    return crumbs
  })

  async function loadFiles(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await api.listProjectFiles(projectId.value, currentDir.value)
      items.value = res.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  function resetTransientModes(): void {
    editMode.value = false
    createMode.value = false
    createDirMode.value = false
    exportMenuOpen.value = false
  }

  function closeSelectedFile(): void {
    selectedFile.value = null
    editMode.value = false
    exportMenuOpen.value = false
  }

  function navigateToDir(path: string): void {
    closeSelectedFile()
    createMode.value = false
    createDirMode.value = false
    currentDir.value = path
    void loadFiles()
  }

  function enterDir(item: ProjectFileItem): void {
    const nextDir = `${currentDir.value === '/' ? '' : currentDir.value}/${item.name}`
    navigateToDir(nextDir)
  }

  async function openFile(item: ProjectFileItem): Promise<void> {
    const filePath = `${currentDir.value === '/' ? '' : currentDir.value}/${item.name}`
    loading.value = true
    try {
      const res = await api.readProjectFile(projectId.value, filePath)
      selectedFile.value = {
        filePath: res.file_path,
        content: res.content,
        isMarkdown: isMarkdownFile(item.name),
      }
      editContent.value = res.content
      editFilePath.value = res.file_path
      editMode.value = false
      createMode.value = false
      createDirMode.value = false
      exportMenuOpen.value = false
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    } finally {
      loading.value = false
    }
  }

  function startCreate(): void {
    resetTransientModes()
    selectedFile.value = null
    createMode.value = true
    newFileName.value = ''
    newFileContent.value = ''
  }

  function cancelCreate(): void {
    createMode.value = false
  }

  async function confirmCreate(): Promise<void> {
    const name = newFileName.value.trim()
    if (!name) return
    const filePath = `${currentDir.value === '/' ? '' : currentDir.value}/${name}`
    try {
      await api.writeProjectFile(projectId.value, {
        file_path: filePath,
        content: newFileContent.value,
      })
      notify.push(t('projects.fileCreated', { name }), 'success', 2000)
      createMode.value = false
      await loadFiles()
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  function startCreateDir(): void {
    resetTransientModes()
    selectedFile.value = null
    createDirMode.value = true
    newDirName.value = ''
  }

  function cancelCreateDir(): void {
    createDirMode.value = false
  }

  async function confirmCreateDir(): Promise<void> {
    const name = newDirName.value.trim()
    if (!name) return
    const dirPath = `${currentDir.value === '/' ? '' : currentDir.value}/${name}`
    try {
      await api.writeProjectFile(projectId.value, {
        file_path: dirPath,
        content: '',
        is_dir: true,
      })
      notify.push(t('projects.dirCreated', { name }), 'success', 2000)
      createDirMode.value = false
      await loadFiles()
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  function startEdit(): void {
    if (!selectedFile.value) return
    editMode.value = true
    editContent.value = selectedFile.value.content
  }

  function cancelEdit(): void {
    editMode.value = false
    if (selectedFile.value) {
      editContent.value = selectedFile.value.content
    }
  }

  async function confirmEdit(): Promise<void> {
    if (!editFilePath.value) return
    try {
      await api.writeProjectFile(projectId.value, {
        file_path: editFilePath.value,
        content: editContent.value,
      })
      notify.push(t('projects.fileUpdated'), 'success', 2000)
      if (selectedFile.value) {
        selectedFile.value.content = editContent.value
      }
      editMode.value = false
      await loadFiles()
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function deleteFile(item: ProjectFileItem): Promise<void> {
    const filePath = `${currentDir.value === '/' ? '' : currentDir.value}/${item.name}`
    const confirmKey = item.is_dir ? 'paper.confirmDeleteDir' : 'paper.confirmDeleteFile'
    const successKey = item.is_dir ? 'paper.dirDeleted' : 'paper.fileDeleted'
    const confirmed = await dialog.confirm({
      title: t('projects.actions.delete'),
      message: t(confirmKey, { name: item.name }),
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      await api.deleteProjectFile(projectId.value, filePath, item.is_dir)
      notify.push(t(successKey, { name: item.name }), 'success', 2000)
      if (selectedFile.value?.filePath === filePath) {
        closeSelectedFile()
      }
      await loadFiles()
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    }
  }

  async function exportFile(format: ProjectFileExportFormat): Promise<void> {
    if (!selectedFile.value) return
    exportLoading.value = true
    try {
      const blob = await api.exportProjectFile(projectId.value, {
        file_path: selectedFile.value.filePath,
        format,
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const ext = format === 'markdown' ? 'md' : format
      anchor.download = `${selectedFile.value.filePath.split('/').pop()?.replace(/\.md$/, '') ?? 'export'}.${ext}`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      notify.push(t('projects.fileExported', { format: format.toUpperCase() }), 'success', 2000)
    } catch (err) {
      notify.push(
        err instanceof Error ? err.message : t('projects.errors.requestFailed'),
        'error',
        3600,
      )
    } finally {
      exportLoading.value = false
    }
  }

  watch(
    projectId,
    () => {
      currentDir.value = '/'
      closeSelectedFile()
      createMode.value = false
      createDirMode.value = false
      void loadFiles()
    },
    { immediate: true },
  )

  return reactive({
    currentDir,
    items,
    loading,
    error,
    selectedFile,
    editMode,
    editContent,
    createMode,
    createDirMode,
    newFileName,
    newFileContent,
    newDirName,
    exportLoading,
    exportMenuOpen,
    breadcrumbs,
    loadFiles,
    navigateToDir,
    enterDir,
    openFile,
    startCreate,
    cancelCreate,
    confirmCreate,
    startCreateDir,
    cancelCreateDir,
    confirmCreateDir,
    startEdit,
    cancelEdit,
    confirmEdit,
    deleteFile,
    exportFile,
    closeSelectedFile,
  })
}
