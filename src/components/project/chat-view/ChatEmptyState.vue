<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ChatInputBox from './ChatInputBox.vue'

const props = defineProps<{
  disabled?: boolean
  projectId?: string
}>()

const emit = defineEmits<{
  send: []
}>()

const inputValue = defineModel<string>({ default: '' })
const inputImages = defineModel<string[]>('images', { default: [] })
const inputPaperIds = defineModel<string[]>('paperIds', { default: () => [] })
const inputExpanded = ref(false)

const { t } = useI18n()

function onSend(): void {
  const text = inputValue.value.trim()
  if (!text || props.disabled) return
  emit('send')
  inputValue.value = ''
  inputImages.value = []
  inputPaperIds.value = []
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Title centered in remaining space -->
    <div class="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h3 class="animate-fade-in-up text-ppx-text-soft text-2xl font-medium tracking-tight">
        {{ t('projects.chatView.emptyChatTitle') }}
      </h3>
    </div>

    <!-- Input area — identical structure to active chat mode -->
    <div class="dark:bg-ppx-bg-elevated border-ppx-border shrink-0 border-t bg-white px-4 py-4">
      <div class="mx-auto max-w-3xl">
        <ChatInputBox
          v-model="inputValue"
          v-model:images="inputImages"
          v-model:paper-ids="inputPaperIds"
          v-model:expanded="inputExpanded"
          :project-id="props.projectId"
          :disabled="disabled"
          @send="onSend"
        />
        <div v-show="!inputExpanded" class="text-ppx-text-muted mt-2 text-center text-xs">
          {{ t('projects.chatView.inputHint') }}
        </div>
      </div>
    </div>
  </div>
</template>
