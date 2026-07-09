<script setup lang="ts">
import { NotebookPen, Pencil, Save, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import AppButton from '@/components/AppButton.vue'
import { useNotify } from '@/composables/useNotify'

import MarkdownContent from '../MarkdownContent.vue'

const props = defineProps<{
  paperId: string
  agentNote: string | null
}>()

const emit = defineEmits<{
  updated: [agentNote: string | null]
}>()

const { t } = useI18n()
const notify = useNotify()

const editMode = ref(false)
const editContent = ref(props.agentNote ?? '')
const saving = ref(false)

watch(
  () => props.agentNote,
  (agentNote) => {
    if (!editMode.value) {
      editContent.value = agentNote ?? ''
    }
  },
)

function startEdit(): void {
  editContent.value = props.agentNote ?? ''
  editMode.value = true
}

function cancelEdit(): void {
  editContent.value = props.agentNote ?? ''
  editMode.value = false
}

async function confirmEdit(): Promise<void> {
  saving.value = true
  try {
    const response = editContent.value
      ? await api.updatePaperAgentNote(props.paperId, { content: editContent.value })
      : await api.deletePaperAgentNote(props.paperId)
    emit('updated', response.agent_note)
    editContent.value = response.agent_note ?? ''
    editMode.value = false
    notify.push(t('paper.agentNote.updated'), 'success', 2000)
  } catch (err) {
    notify.push(
      err instanceof Error ? err.message : t('paper.agentNote.updateFailed'),
      'error',
      3600,
    )
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="workspace-panel space-y-3 p-3.5">
    <div class="flex items-center justify-between gap-2">
      <h3 class="workspace-section-title inline-flex items-center gap-1.5">
        <NotebookPen class="h-4 w-4" />
        <span>{{ t('paper.sections.agentNote') }}</span>
      </h3>
      <div class="flex items-center gap-1.5">
        <template v-if="!editMode">
          <AppButton size="xs" variant="outline" @click="startEdit">
            <Pencil class="h-4 w-4" />
            <span>{{ t('projects.edit') }}</span>
          </AppButton>
        </template>
        <template v-else>
          <AppButton size="xs" variant="outline" :disabled="saving" @click="cancelEdit">
            <X class="h-4 w-4" />
            <span>{{ t('projects.actions.cancel') }}</span>
          </AppButton>
          <AppButton size="xs" variant="solid" :loading="saving" @click="confirmEdit">
            <Save class="h-4 w-4" />
            <span>{{ t('projects.actions.save') }}</span>
          </AppButton>
        </template>
      </div>
    </div>

    <template v-if="!editMode">
      <div v-if="props.agentNote" class="workspace-subpanel p-2.5">
        <MarkdownContent :markdown="props.agentNote" />
      </div>
      <div v-else class="workspace-body">-</div>
    </template>

    <div v-else>
      <textarea
        v-model="editContent"
        rows="12"
        class="workspace-textarea min-h-56 w-full font-mono text-sm"
        :placeholder="t('paper.agentNote.placeholder')"
      />
    </div>
  </section>
</template>
