import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { api } from '../api/client'
import type { PaperResponse, ProjectResponse } from '../types/api'

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<ProjectResponse[]>([])
  const papersByProject = ref<Record<string, PaperResponse[]>>({})
  const paperPageByProject = ref<
    Record<string, { total: number; offset: number; limit: number }>
  >({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProjects(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const payload = await api.listProjects()
      projects.value = payload.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
    } finally {
      loading.value = false
    }
  }

  async function createProject(name: string, description: string | null): Promise<void> {
    await api.createProject({ name, description })
    await fetchProjects()
  }

  async function removeProject(projectId: string): Promise<void> {
    await api.deleteProject(projectId)
    projects.value = projects.value.filter((item) => item.project_id !== projectId)
    delete papersByProject.value[projectId]
    delete paperPageByProject.value[projectId]
  }

  async function fetchProjectPapers(
    projectId: string,
    options?: { offset?: number; limit?: number },
  ): Promise<void> {
    loading.value = true
    error.value = null
    const currentPage = paperPageByProject.value[projectId]
    const offset = options?.offset ?? currentPage?.offset ?? 0
    const limit = options?.limit ?? currentPage?.limit ?? 20
    try {
      const payload = await api.listProjectPapers(projectId, offset, limit)
      papersByProject.value[projectId] = payload.items
      paperPageByProject.value[projectId] = {
        total: payload.total,
        offset: payload.offset,
        limit: payload.limit,
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch project papers'
    } finally {
      loading.value = false
    }
  }

  async function unlinkProjectPaper(projectId: string, paperId: string): Promise<void> {
    await api.unlinkProjectPaper(projectId, paperId)
    await fetchProjectPapers(projectId)
  }

  const paperPagination = computed(() => {
    return (projectId: string) =>
      paperPageByProject.value[projectId] ?? { total: 0, offset: 0, limit: 20 }
  })

  async function prevProjectPaperPage(projectId: string): Promise<void> {
    const page = paperPageByProject.value[projectId] ?? { total: 0, offset: 0, limit: 20 }
    const nextOffset = Math.max(0, page.offset - page.limit)
    await fetchProjectPapers(projectId, { offset: nextOffset, limit: page.limit })
  }

  async function nextProjectPaperPage(projectId: string): Promise<void> {
    const page = paperPageByProject.value[projectId] ?? { total: 0, offset: 0, limit: 20 }
    const nextOffset = page.offset + page.limit
    if (nextOffset >= page.total) {
      return
    }
    await fetchProjectPapers(projectId, { offset: nextOffset, limit: page.limit })
  }

  async function setProjectPaperLimit(projectId: string, limit: number): Promise<void> {
    const normalized = Math.max(1, Math.min(limit, 100))
    await fetchProjectPapers(projectId, { offset: 0, limit: normalized })
  }

  async function setProjectPaperPage(projectId: string, page: number): Promise<void> {
    const current = paperPageByProject.value[projectId] ?? { total: 0, offset: 0, limit: 20 }
    const totalPages = Math.max(1, Math.ceil(current.total / current.limit))
    const targetPage = Math.max(1, Math.min(page, totalPages))
    const nextOffset = (targetPage - 1) * current.limit
    await fetchProjectPapers(projectId, { offset: nextOffset, limit: current.limit })
  }

  return {
    projects,
    papersByProject,
    paperPageByProject,
    paperPagination,
    loading,
    error,
    fetchProjects,
    createProject,
    removeProject,
    fetchProjectPapers,
    unlinkProjectPaper,
    prevProjectPaperPage,
    nextProjectPaperPage,
    setProjectPaperLimit,
    setProjectPaperPage,
  }
})
