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
  <div class="flex h-full flex-col items-center justify-center px-4 text-center">
    <h3 class="animate-fade-in-up text-ppx-text-soft mb-8 text-2xl font-medium tracking-tight">
      {{ t('chat.emptyChatTitle') }}
    </h3>

    <div class="animate-fade-in-up w-full max-w-2xl delay-100">
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
        {{ t('chat.inputHint') }}
      </div>
    </div>
  </div>
</template>
