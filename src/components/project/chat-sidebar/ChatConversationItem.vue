<script setup lang="ts">
import { MessageSquare } from 'lucide-vue-next'
import type { ConversationResponse } from '@/types/api'

const props = defineProps<{
  conversation: ConversationResponse
  active: boolean
}>()

const emit = defineEmits<{
  select: [conversationId: string]
}>()

function onSelect(): void {
  emit('select', props.conversation.conversation_id)
}
</script>

<template>
  <button
    type="button"
    class="group duration-ppx-fast relative flex h-9 w-full cursor-pointer items-center gap-2 rounded-xl px-2 text-left transition-colors"
    :class="
      active
        ? 'bg-ppx-bg-elevated shadow-ppx-rest text-ppx-text'
        : 'hover:bg-ppx-bg-elevated/60 text-ppx-text-soft'
    "
    @click="onSelect"
  >
    <MessageSquare class="h-4 w-4" />
    <div class="min-w-0 flex-1 truncate text-sm font-medium">
      {{ conversation.title }}
    </div>
  </button>
</template>
