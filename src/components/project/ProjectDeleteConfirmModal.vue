<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/AppButton.vue'
import AppModalShell from '@/components/AppModalShell.vue'

const props = defineProps<{
  open: boolean
  projectName: string
  projectId: string
  paperCount: number
  conversationCount: number
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const { t } = useI18n()

const deleteConfirmName = ref('')
const deleteNameMismatch = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      deleteConfirmName.value = ''
      deleteNameMismatch.value = false
    }
  },
)

function handleConfirm() {
  if (deleteConfirmName.value.trim() !== props.projectName) {
    deleteNameMismatch.value = true
    return
  }
  emit('confirm')
}
</script>

<template>
  <AppModalShell
    :open="open"
    :title="t('projects.deleteConfirmTitle')"
    width-class="max-w-md"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <p class="workspace-body whitespace-pre-wrap">
        {{ t('projects.deleteConfirmHint', { name: projectName }) }}
        <template v-if="paperCount > 0">
          <br />
          <strong>{{ t('projects.deleteConfirmPapers', { count: paperCount }) }}</strong>
        </template>
        <template v-if="conversationCount > 0">
          <br /><strong>{{
            t('projects.deleteConfirmConversations', { count: conversationCount })
          }}</strong>
        </template>
      </p>

      <div>
        <label class="workspace-label mb-1.5 block">{{
          t('projects.deleteConfirmInputLabel')
        }}</label>
        <input
          v-model="deleteConfirmName"
          type="text"
          class="workspace-input w-full"
          :placeholder="projectName"
          @keydown.enter.prevent="handleConfirm"
        />
        <p v-if="deleteNameMismatch" class="mt-1.5 text-xs text-rose-600 dark:text-rose-300">
          {{ t('projects.deleteConfirmMismatch') }}
        </p>
      </div>

      <div class="flex justify-end gap-2">
        <AppButton size="sm" variant="outline" @click="emit('close')">{{
          t('projects.actions.cancel')
        }}</AppButton>
        <AppButton
          size="sm"
          tone="rose"
          variant="solid"
          :disabled="deleteConfirmName.trim() !== projectName"
          @click="handleConfirm"
          >{{ t('projects.actions.delete') }}</AppButton
        >
      </div>
    </div>
  </AppModalShell>
</template>
