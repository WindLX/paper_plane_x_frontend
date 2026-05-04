<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import AppButton from '@/components/AppButton.vue'
import AppModalShell from '@/components/AppModalShell.vue'
import ProjectChatSidebar from '@/components/project/ProjectChatSidebar.vue'
import ProjectChatView from '@/components/project/ProjectChatView.vue'
import ProjectTopbarDrawer from '@/components/project/ProjectTopbarDrawer.vue'
import { useNotify } from '@/composables/useNotify'
import { useConversationStore } from '@/stores/conversation'
import { useUiStore } from '@/stores/ui'
import type {
  LibrarianGlobalFinderResponse,
  ProjectResponse,
  ProjectExportField,
} from '@/types/api'

const props = defineProps<{
  projectId: string
}>()

const { t } = useI18n()
const notify = useNotify()
const chatStore = useConversationStore()
const uiStore = useUiStore()
const project = ref<ProjectResponse | null>(null)
const globalFinder = ref<LibrarianGlobalFinderResponse | null>(null)
const loading = ref(false)
const sidebarOpen = ref(true)
const deleteConfirmOpen = ref(false)
const deleteConfirmName = ref('')
const deleteNameMismatch = ref(false)

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const [projectRes, gfRes] = await Promise.all([
      api.getProject(props.projectId),
      api.librarianGlobalFinder(props.projectId),
    ])
    project.value = projectRes
    globalFinder.value = gfRes
    uiStore.setPageTitle(projectRes.name ?? props.projectId)
    uiStore.setPageSubtitle(projectRes.description ?? '')
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  uiStore.clearPageTitle()
  uiStore.clearPageSubtitle()
})

async function handleCreateConversation(): Promise<void> {
  await chatStore.createConversation(props.projectId)
}

async function updateAgentSummary(content: string): Promise<void> {
  try {
    const res = await api.setProjectAgentSummary(props.projectId, content)
    project.value = res
    if (globalFinder.value) {
      globalFinder.value.agent_summary = res.agent_summary
    }
    notify.push(t('projectDetail.agentSummaryUpdated'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function deleteAgentSummary(): Promise<void> {
  try {
    const res = await api.deleteProjectAgentSummary(props.projectId)
    project.value = res
    if (globalFinder.value) {
      globalFinder.value.agent_summary = null
    }
    notify.push(t('projectDetail.agentSummaryDeleted'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function forceAgentSummary(): Promise<void> {
  try {
    const res = await api.librarianForceAgentSummary(props.projectId)
    if (project.value) {
      project.value.agent_summary = res.agent_summary
    }
    if (globalFinder.value) {
      globalFinder.value.agent_summary = res.agent_summary
    }
    notify.push(t('projectDetail.agentSummaryUpdated'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function updateProject(payload: {
  name?: string | null
  description?: string | null
}): Promise<void> {
  try {
    const res = await api.updateProject(props.projectId, payload)
    project.value = res
    uiStore.setPageTitle(res.name ?? props.projectId)
    uiStore.setPageSubtitle(res.description ?? '')
    notify.push(t('projectDetail.projectUpdated'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

function openDeleteConfirm(): void {
  deleteConfirmOpen.value = true
  deleteConfirmName.value = ''
  deleteNameMismatch.value = false
}

function closeDeleteConfirm(): void {
  deleteConfirmOpen.value = false
  deleteConfirmName.value = ''
  deleteNameMismatch.value = false
}

async function confirmDeleteProject(): Promise<void> {
  const expectedName = project.value?.name ?? props.projectId
  if (deleteConfirmName.value.trim() !== expectedName) {
    deleteNameMismatch.value = true
    return
  }
  deleteNameMismatch.value = false
  deleteConfirmOpen.value = false

  try {
    await api.deleteProject(props.projectId)
    notify.push(t('projectDetail.projectDeleted'), 'success', 2000)
    setTimeout(() => {
      window.location.href = '/'
    }, 800)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

async function exportProject(payload: {
  fields: ProjectExportField[]
  citationsMode: 'keep' | 'strip'
}): Promise<void> {
  try {
    const blob = await api.exportProject(props.projectId, {
      fields: payload.fields,
      citations_mode: payload.citationsMode,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.projectId}_export.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    notify.push(t('projectDetail.exportReady'), 'success', 2000)
  } catch (err) {
    notify.push(err instanceof Error ? err.message : t('errors.requestFailed'), 'error', 3600)
  }
}

watch(() => props.projectId, loadData, { immediate: true })
</script>

<template>
  <div class="h-full">
    <section class="flex h-full overflow-hidden">
      <!-- Chat sidebar -->
      <div
        class="duration-ppx-standard ease-ppx h-full shrink-0 transition-[width]"
        :class="sidebarOpen ? 'w-68' : 'w-18'"
      >
        <ProjectChatSidebar
          :project-id="projectId"
          :collapsed="!sidebarOpen"
          @select="sidebarOpen = true"
          @create="handleCreateConversation"
          @toggle="sidebarOpen = !sidebarOpen"
        />
      </div>

      <!-- Chat main area -->
      <div class="flex h-full min-w-0 flex-1 flex-col">
        <ProjectTopbarDrawer
          :project="project"
          :global-finder="globalFinder"
          :loading="loading"
          @update:agent-summary="updateAgentSummary"
          @delete:agent-summary="deleteAgentSummary"
          @force-agent-summary="forceAgentSummary"
          @update:project="updateProject"
          @delete:project="openDeleteConfirm"
          @export:project="exportProject"
        />
        <ProjectChatView :project-id="projectId" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      </div>
    </section>

    <!-- Delete confirmation modal -->
    <AppModalShell
      :open="deleteConfirmOpen"
      :title="t('projectDetail.deleteConfirmTitle')"
      width-class="max-w-md"
      @close="closeDeleteConfirm"
    >
      <div class="space-y-4">
        <p class="workspace-body whitespace-pre-wrap">
          {{ t('projectDetail.deleteConfirmHint', { name: project?.name ?? props.projectId }) }}
          <template v-if="(globalFinder?.stats?.paper_count ?? 0) > 0">
            <br />
            <strong>{{
              t('projectDetail.deleteConfirmPapers', { count: globalFinder?.stats?.paper_count })
            }}</strong>
          </template>
          <template v-if="(project?.conversation_count ?? 0) > 0">
            <br /><strong>{{
              t('projectDetail.deleteConfirmConversations', { count: project?.conversation_count })
            }}</strong>
          </template>
        </p>

        <div>
          <label class="workspace-label mb-1.5 block">{{
            t('projectDetail.deleteConfirmInputLabel')
          }}</label>
          <input
            v-model="deleteConfirmName"
            type="text"
            class="workspace-input w-full"
            :placeholder="project?.name ?? props.projectId"
            @keydown.enter.prevent="confirmDeleteProject"
          />
          <p v-if="deleteNameMismatch" class="mt-1.5 text-xs text-rose-600 dark:text-rose-300">
            {{ t('projectDetail.deleteConfirmMismatch') }}
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <AppButton size="sm" variant="outline" @click="closeDeleteConfirm">{{
            t('actions.cancel')
          }}</AppButton>
          <AppButton
            size="sm"
            tone="rose"
            variant="solid"
            :disabled="deleteConfirmName.trim() !== (project?.name ?? props.projectId)"
            @click="confirmDeleteProject"
            >{{ t('actions.delete') }}</AppButton
          >
        </div>
      </div>
    </AppModalShell>
  </div>
</template>
