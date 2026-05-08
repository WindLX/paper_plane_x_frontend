<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle, MessageSquare } from 'lucide-vue-next'

import SidebarButton from '@/components/sidebar/SidebarButton.vue'
import { useConversationWsStore } from '@/stores/conversationWs'
import type { ConversationResponse } from '@/types/api'

const props = defineProps<{
  conversation: ConversationResponse
  active: boolean
}>()

const emit = defineEmits<{
  select: [conversationId: string]
}>()

const conversationWsStore = useConversationWsStore()

function onSelect(): void {
  emit('select', props.conversation.conversation_id)
}

const isStreaming = computed(
  () => conversationWsStore.getState(props.conversation.conversation_id).isStreaming,
)
</script>

<template>
  <SidebarButton variant="item" :active="active" @click="onSelect">
    <template #icon>
      <MessageSquare class="h-4 w-4" />
    </template>
    <span class="flex items-center">
      {{ conversation.title }}
      <LoaderCircle
        v-if="isStreaming"
        class="text-ppx-accent ml-auto h-3.5 w-3.5 shrink-0 animate-spin"
      />
    </span>
  </SidebarButton>
</template>
