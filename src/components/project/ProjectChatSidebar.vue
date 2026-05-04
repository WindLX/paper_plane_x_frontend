<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronDown, MessageSquarePlus, Search } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import ChatSidebarHeader from './chat-sidebar/ChatSidebarHeader.vue'
import ChatConversationItem from './chat-sidebar/ChatConversationItem.vue'
import ChatSearchModal from './chat-sidebar/ChatSearchModal.vue'
import { useConversationStore } from '@/stores/conversation'
import type { ConversationResponse } from '@/types/api'

const props = defineProps<{
  projectId: string
  collapsed?: boolean
}>()

const emit = defineEmits<{
  select: [conversationId: string]
  create: []
  toggle: []
}>()

const { t } = useI18n()
const chatStore = useConversationStore()

const chatsOpen = ref(true)
const chatsGroupOpen = ref({
  recent7: true,
  recent30: true,
  older: true,
})
const searchModalOpen = ref(false)
const modalKeyword = ref('')

watch(
  () => props.projectId,
  (newProjectId, oldProjectId) => {
    if (oldProjectId !== undefined && newProjectId !== oldProjectId) {
      chatStore.currentConversationId = null
      chatStore.messages = []
      chatStore.turns = []
    }
    chatStore.loadConversations(newProjectId)
  },
  { immediate: true },
)

const allConversations = computed(() => chatStore.projectConversations(props.projectId))

const groupedConversations = computed(() => {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const recent7: ConversationResponse[] = []
  const recent30: ConversationResponse[] = []
  const older: ConversationResponse[] = []

  allConversations.value.forEach((conversation) => {
    const updatedAt = new Date(conversation.updated_at).getTime()
    const diffDays = Number.isFinite(updatedAt) ? (now - updatedAt) / oneDay : 365
    if (diffDays <= 7) {
      recent7.push(conversation)
    } else if (diffDays <= 30) {
      recent30.push(conversation)
    } else {
      older.push(conversation)
    }
  })

  return [
    { key: 'recent7' as const, label: t('projects.sidebar.groupRecent7'), conversations: recent7 },
    {
      key: 'recent30' as const,
      label: t('projects.sidebar.groupRecent30'),
      conversations: recent30,
    },
    { key: 'older' as const, label: t('projects.sidebar.groupOlder'), conversations: older },
  ]
})

function isActive(conversation: ConversationResponse): boolean {
  return chatStore.currentConversationId === conversation.conversation_id
}

function groupHasActive(groupConversations: readonly ConversationResponse[]): boolean {
  return groupConversations.some((c) => isActive(c))
}

function groupExpanded(
  key: keyof typeof chatsGroupOpen.value,
  groupConversations: readonly ConversationResponse[],
): boolean {
  return groupHasActive(groupConversations) || chatsGroupOpen.value[key]
}

function toggleGroup(
  key: keyof typeof chatsGroupOpen.value,
  groupConversations: readonly ConversationResponse[],
): void {
  if (groupHasActive(groupConversations)) return
  chatsGroupOpen.value[key] = !chatsGroupOpen.value[key]
}

async function handleSelect(conversationId: string): Promise<void> {
  await chatStore.selectConversation(conversationId)
  emit('select', conversationId)
}

async function handleSelectFromModal(conversationId: string): Promise<void> {
  await chatStore.selectConversation(conversationId)
  emit('select', conversationId)
  searchModalOpen.value = false
  modalKeyword.value = ''
}

async function handleCreate(): Promise<void> {
  emit('create')
}
</script>

<template>
  <aside
    class="border-ppx-border bg-ppx-bg flex h-full flex-col border-r"
    :class="props.collapsed ? 'w-18 items-center' : 'w-68'"
  >
    <ChatSidebarHeader :collapsed="props.collapsed" @toggle="emit('toggle')" />

    <!-- Conversation list section -->
    <div class="border-ppx-border min-h-0 flex-1 overflow-y-auto border-t pt-3">
      <button
        v-if="!props.collapsed"
        type="button"
        class="text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-8 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition-colors"
        @click="chatsOpen = !chatsOpen"
      >
        <span>{{ t('chat.sidebarSubtitle') }}</span>
        <ChevronDown
          class="text-ppx-text-soft duration-ppx-fast h-4 w-4 transition-transform"
          :class="chatsOpen ? '' : '-rotate-90'"
        />
      </button>

      <div
        class="duration-ppx-standard ease-ppx grid transition-all"
        :class="chatsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
      >
        <div class="mt-1 min-h-0 space-y-1 px-2 pb-2">
          <!-- New conversation button -->
          <button
            type="button"
            class="group duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 text-sm font-medium transition-colors"
            @click="handleCreate"
          >
            <MessageSquarePlus class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
            <span v-if="!props.collapsed">{{ t('chat.newConversationBtn') }}</span>
          </button>

          <!-- Search conversations button -->
          <button
            type="button"
            class="group duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 text-sm font-medium transition-colors"
            @click="searchModalOpen = true"
          >
            <Search class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
            <span v-if="!props.collapsed">{{ t('chat.searchPlaceholder') }}</span>
          </button>

          <!-- Grouped conversations -->
          <template v-if="!props.collapsed">
            <section
              v-for="group in groupedConversations"
              :key="group.key"
              class="border-ppx-border border-t pt-2 first:border-t-0"
            >
              <button
                type="button"
                class="duration-ppx-fast text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text flex h-8 w-full cursor-pointer items-center justify-between rounded-xl px-2 text-left text-sm font-semibold transition-colors"
                @click="toggleGroup(group.key, group.conversations)"
              >
                <span>{{ group.label }}</span>
                <ChevronDown
                  class="duration-ppx-fast h-3.5 w-3.5 transition-transform"
                  :class="groupExpanded(group.key, group.conversations) ? '' : '-rotate-90'"
                />
              </button>

              <div
                class="duration-ppx-standard ease-ppx grid transition-all"
                :class="
                  groupExpanded(group.key, group.conversations)
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                "
              >
                <div class="min-h-0 space-y-1">
                  <ChatConversationItem
                    v-for="conversation in group.conversations"
                    :key="conversation.conversation_id"
                    :conversation="conversation"
                    :active="isActive(conversation)"
                    @select="handleSelect"
                  />
                </div>
              </div>
            </section>

            <div
              v-if="allConversations.length === 0"
              class="flex flex-col items-center justify-center py-12 text-center"
            >
              <p class="text-ppx-text-muted text-xs">
                {{ t('chat.emptyState') }}
              </p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <ChatSearchModal
      v-model:keyword="modalKeyword"
      :open="searchModalOpen"
      :results="allConversations"
      @select="handleSelectFromModal"
      @create="handleCreate"
      @close="((searchModalOpen = false), (modalKeyword = ''))"
    />
  </aside>
</template>
