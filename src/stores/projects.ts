import { defineStore } from 'pinia'
import { ref } from 'vue'

import { translate } from '../i18n'
import { api } from '@/api'
import { usePagination } from '@/composables/usePagination'
import type { ProjectSortKey } from '@/types/sort'
import type { ProjectResponse } from '@/types/api'

export const useProjectStore = defineStore('projects', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const paginated = usePagination<ProjectResponse, ProjectSortKey>({
    fetcher: ({ offset, limit, sortOrder, sortBy }) =>
      api.listProjects(offset, limit, sortOrder, sortBy),
    defaultLimit: 20,
  })

  async function fetchProjects(options?: Parameters<typeof paginated.fetch>[0]): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await paginated.fetch(options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('errors.fetchProjects')
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
    paginated.items.value = paginated.items.value.filter((item) => item.project_id !== projectId)
  }

  return {
    projects: paginated.items,
    loading,
    error,
    total: paginated.total,
    offset: paginated.offset,
    limit: paginated.limit,
    sortOrder: paginated.sortOrder,
    sortBy: paginated.sortBy,
    totalPages: paginated.totalPages,
    currentPage: paginated.currentPage,
    hasPrevPage: paginated.hasPrevPage,
    hasNextPage: paginated.hasNextPage,
    fetchProjects,
    createProject,
    removeProject,
    setPage: paginated.setPage,
    nextPage: paginated.nextPage,
    prevPage: paginated.prevPage,
    setLimit: paginated.setLimit,
    toggleSort: paginated.toggleSort,
  }
})
