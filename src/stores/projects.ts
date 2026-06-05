import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

import { translate } from '@/i18n'
import { api } from '@/api'
import type { ProjectResponse, ProjectUpdateRequest } from '@/types/api'

function sortProjectIds(ids: string[], projectsById: Record<string, ProjectResponse>): string[] {
  return [...ids].sort((leftId, rightId) => {
    const left = projectsById[leftId]
    const right = projectsById[rightId]
    if (!left && !right) return 0
    if (!left) return 1
    if (!right) return -1
    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  })
}

export const useProjectStore = defineStore('projects', () => {
  const projectsById = reactive<Record<string, ProjectResponse>>({})
  const orderedProjectIds = ref<string[]>([])
  const currentProjectId = ref<string | null>(null)
  const listLoading = ref(false)
  const detailLoading = ref(false)
  const mutating = ref(false)
  const error = ref<string | null>(null)

  const loading = computed(() => listLoading.value || detailLoading.value || mutating.value)

  const projects = computed(() =>
    orderedProjectIds.value
      .map((projectId) => projectsById[projectId])
      .filter((project): project is ProjectResponse => Boolean(project)),
  )

  const currentProject = computed(() =>
    currentProjectId.value ? (projectsById[currentProjectId.value] ?? null) : null,
  )

  function syncProject(project: ProjectResponse): ProjectResponse {
    projectsById[project.project_id] = project
    if (!orderedProjectIds.value.includes(project.project_id)) {
      orderedProjectIds.value = [project.project_id, ...orderedProjectIds.value]
    }
    orderedProjectIds.value = sortProjectIds(orderedProjectIds.value, projectsById)
    return project
  }

  function syncProjects(projects: ProjectResponse[]): void {
    const nextIds = projects.map((project) => {
      projectsById[project.project_id] = project
      return project.project_id
    })

    for (const projectId of orderedProjectIds.value) {
      if (!nextIds.includes(projectId) && projectsById[projectId]) {
        delete projectsById[projectId]
      }
    }

    orderedProjectIds.value = sortProjectIds(nextIds, projectsById)
  }

  function patchProject(projectId: string, patch: Partial<ProjectResponse>): void {
    const existing = projectsById[projectId]
    if (!existing) return
    projectsById[projectId] = {
      ...existing,
      ...patch,
    }
    orderedProjectIds.value = sortProjectIds(orderedProjectIds.value, projectsById)
  }

  function removeProjectEntity(projectId: string): void {
    delete projectsById[projectId]
    orderedProjectIds.value = orderedProjectIds.value.filter((id) => id !== projectId)
    if (currentProjectId.value === projectId) {
      currentProjectId.value = null
    }
  }

  function selectProject(projectId: string | null): void {
    currentProjectId.value = projectId
  }

  async function fetchProjects(): Promise<ProjectResponse[]> {
    listLoading.value = true
    error.value = null
    try {
      const response = await api.listProjects(0, 100, 'desc', 'updated_at')
      syncProjects(response.items)
      return response.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('projects.errors.listProjects')
      return []
    } finally {
      listLoading.value = false
    }
  }

  async function fetchProject(projectId: string): Promise<ProjectResponse | null> {
    detailLoading.value = true
    error.value = null
    try {
      const project = await api.getProject(projectId)
      syncProject(project)
      return project
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('projects.errors.requestFailed')
      return null
    } finally {
      detailLoading.value = false
    }
  }

  async function createProject(
    name: string,
    description: string | null,
  ): Promise<ProjectResponse | null> {
    mutating.value = true
    error.value = null
    try {
      const project = await api.createProject({ name, description })
      syncProject(project)
      currentProjectId.value = project.project_id
      return project
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('projects.errors.createProject')
      return null
    } finally {
      mutating.value = false
    }
  }

  async function updateProject(
    projectId: string,
    payload: ProjectUpdateRequest,
  ): Promise<ProjectResponse | null> {
    mutating.value = true
    error.value = null
    try {
      const project = await api.updateProject(projectId, payload)
      syncProject(project)
      return project
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('projects.errors.requestFailed')
      return null
    } finally {
      mutating.value = false
    }
  }

  async function deleteProject(projectId: string): Promise<boolean> {
    mutating.value = true
    error.value = null
    try {
      await api.deleteProject(projectId)
      removeProjectEntity(projectId)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('projects.errors.deleteProject')
      return false
    } finally {
      mutating.value = false
    }
  }

  return {
    projectsById,
    orderedProjectIds,
    currentProjectId,
    currentProject,
    projects,
    loading,
    listLoading,
    detailLoading,
    mutating,
    error,
    selectProject,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    patchProject,
    syncProject,
  }
})
