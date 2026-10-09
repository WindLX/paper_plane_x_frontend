import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type { ProjectOverviewResponse } from '@/types/api'

/** The overview endpoint returns short recent lists; the UI shows at most five each. */
export const RECENT_LIST_LIMIT = 5

/** Attention items are bounded in the UI while the stats count keeps the full total. */
export const ATTENTION_LIST_LIMIT = 10

export function useProjectOverview(projectId: Ref<string>) {
  const overview = ref<ProjectOverviewResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let request = 0

  const stats = computed(() => overview.value?.stats ?? null)
  const attentionItems = computed(() =>
    (overview.value?.attention_items ?? []).slice(0, ATTENTION_LIST_LIMIT),
  )
  const recentPapers = computed(() =>
    (overview.value?.recent_papers ?? []).slice(0, RECENT_LIST_LIMIT),
  )
  const recentFiles = computed(() =>
    (overview.value?.recent_files ?? []).slice(0, RECENT_LIST_LIMIT),
  )
  const recentActivities = computed(() =>
    (overview.value?.recent_activities ?? []).slice(0, RECENT_LIST_LIMIT),
  )
  const topTags = computed(() => overview.value?.top_tags ?? [])
  const yearDistribution = computed(() => overview.value?.year_distribution ?? null)
  const yearRange = computed(() => overview.value?.year_range ?? null)
  const sectionErrors = computed(() => overview.value?.section_errors ?? {})
  const agentSummary = computed(() => overview.value?.agent_summary ?? null)

  async function load(): Promise<void> {
    if (!projectId.value) return
    const current = ++request
    loading.value = true
    error.value = null
    try {
      const result = await api.getProjectOverview(projectId.value)
      if (current !== request) return
      overview.value = result
    } catch (err) {
      if (current !== request) return
      error.value = err instanceof Error ? err.message : translate('workbench.overview.loadFailed')
    } finally {
      if (current === request) loading.value = false
    }
  }

  /** Apply an agent summary returned by the dedicated summary endpoints. */
  function patchAgentSummary(summary: string | null): void {
    if (overview.value) {
      overview.value = { ...overview.value, agent_summary: summary }
    }
  }

  watch(
    projectId,
    () => {
      request++
      overview.value = null
      error.value = null
      loading.value = false
    },
    { immediate: true },
  )
  onScopeDispose(() => {
    request++
  })

  return {
    overview,
    loading,
    error,
    stats,
    attentionItems,
    recentPapers,
    recentFiles,
    recentActivities,
    topTags,
    yearDistribution,
    yearRange,
    sectionErrors,
    agentSummary,
    load,
    patchAgentSummary,
  }
}
