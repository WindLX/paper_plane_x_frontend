<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle, MessageSquare } from 'lucide-vue-next'
import { useConversationStore } from '@/stores/conversation'
import type { ConversationResponse } from '@/types/api'

const props = defineProps<{
  conversation: ConversationResponse
  active: boolean
}>()

const emit = defineEmits<{
  select: [conversationId: string]
}>()

const chatStore = useConversationStore()

function onSelect(): void {
  emit('select', props.conversation.conversation_id)
}

const isStreaming = computed(
  () => chatStore.streamingConversationId === props.conversation.conversation_id,
)
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
    <LoaderCircle v-if="isStreaming" class="text-ppx-accent h-3.5 w-3.5 shrink-0 animate-spin" />
  </button>
</template>
