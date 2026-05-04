<script setup lang="ts">
import { FolderPlus, MessageSquareText } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppModalShell from '@/components/AppModalShell.vue'
import SimpleSearchBar from '@/components/SimpleSearchBar.vue'
import { formatDateTime } from '@/utils/format'
import type { ConversationResponse } from '@/types/api'

const keyword = defineModel<string>('keyword', { default: '' })

const props = defineProps<{
  open: boolean
  results: ConversationResponse[]
}>()

const emit = defineEmits<{
  select: [conversationId: string]
  create: []
  close: []
}>()

const { t } = useI18n()

const displayResults = computed(() => {
  const search = keyword.value.trim().toLowerCase()
  if (!search) return props.results
  return props.results.filter((c) => c.title.toLowerCase().includes(search))
})
</script>

<template>
  <AppModalShell
    :open="props.open"
    :title="t('chat.searchPlaceholder')"
    width-class="max-w-md"
    @close="emit('close')"
  >
    <div class="space-y-3">
      <SimpleSearchBar
        v-model="keyword"
        variant="elevated"
        :placeholder="t('chat.searchPlaceholder')"
      />

      <div :key="keyword" class="animate-fade-in-up space-y-1">
        <button
          type="button"
          class="duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          @click="emit('create')"
        >
          <FolderPlus class="text-ppx-text-soft h-4 w-4 shrink-0" />
          <div class="min-w-0">
            <div class="text-ppx-text-soft truncate font-medium">
              {{ t('chat.newConversationBtn') }}
            </div>
            <div class="text-ppx-text-soft truncate text-xs">
              {{ t('chat.emptyState') }}
            </div>
          </div>
        </button>

        <button
          v-for="conv in displayResults"
          :key="conv.conversation_id"
          type="button"
          class="duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors"
          @click="emit('select', conv.conversation_id)"
        >
          <MessageSquareText class="text-ppx-text-soft h-4 w-4 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="text-ppx-text-soft truncate font-medium">{{ conv.title }}</div>
            <div class="text-ppx-text-soft truncate text-xs">
              {{ formatDateTime(conv.updated_at) }}
            </div>
          </div>
        </button>

        <div v-if="displayResults.length === 0" class="workspace-body px-3 py-6 text-center">
          {{ keyword.trim() ? t('chat.noSearchResults') : t('chat.emptyState') }}
        </div>
      </div>
    </div>
  </AppModalShell>
</template>
