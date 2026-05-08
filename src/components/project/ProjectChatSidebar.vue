<script setup lang="ts">
import { computed, ref } from 'vue'
import { MessageSquarePlus, Search } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import ChatSidebarHeader from './chat-sidebar/ChatSidebarHeader.vue'
import ChatConversationItem from './chat-sidebar/ChatConversationItem.vue'
import ChatSearchModal from './chat-sidebar/ChatSearchModal.vue'
import SidebarButton from '@/components/sidebar/SidebarButton.vue'
import VirtualScrollList from '@/components/VirtualScrollList.vue'
import type { ConversationResponse } from '@/types/api'

const props = defineProps<{
  conversations: ConversationResponse[]
  activeConversationId?: string | null
  collapsed?: boolean
  loading?: boolean
  mobile?: boolean
  open?: boolean
}>()

const emit = defineEmits<{
  select: [conversationId: string]
  create: []
  toggle: []
}>()

const { t } = useI18n()

const chatsOpen = ref(true)
const searchModalOpen = ref(false)
const modalKeyword = ref('')

type FlatEntry =
  | { _type: 'group-header'; _key: string; key: string; label: string; count: number }
  | { _type: 'item'; _key: string; conversation: ConversationResponse }

const flatItems = computed<FlatEntry[]>(() => {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const recent7: ConversationResponse[] = []
  const recent30: ConversationResponse[] = []
  const older: ConversationResponse[] = []

  props.conversations.forEach((conversation) => {
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

  const result: FlatEntry[] = []
  if (recent7.length) {
    result.push({
      _type: 'group-header',
      _key: 'gh-recent7',
      key: 'recent7',
      label: t('projects.chatSidebar.groupRecent7'),
      count: recent7.length,
    })
    result.push(
      ...recent7.map((conversation) => ({
        _type: 'item' as const,
        _key: `c-${conversation.conversation_id}`,
        conversation,
      })),
    )
  }
  if (recent30.length) {
    result.push({
      _type: 'group-header',
      _key: 'gh-recent30',
      key: 'recent30',
      label: t('projects.chatSidebar.groupRecent30'),
      count: recent30.length,
    })
    result.push(
      ...recent30.map((conversation) => ({
        _type: 'item' as const,
        _key: `c-${conversation.conversation_id}`,
        conversation,
      })),
    )
  }
  if (older.length) {
    result.push({
      _type: 'group-header',
      _key: 'gh-older',
      key: 'older',
      label: t('projects.chatSidebar.groupOlder'),
      count: older.length,
    })
    result.push(
      ...older.map((conversation) => ({
        _type: 'item' as const,
        _key: `c-${conversation.conversation_id}`,
        conversation,
      })),
    )
  }
  return result
})

const searchResults = computed(() => {
  const search = modalKeyword.value.trim().toLowerCase()
  if (!search) return props.conversations
  return props.conversations.filter((conversation) => {
    const haystacks = [conversation.title ?? '', conversation.conversation_id]
    return haystacks.some((value) => value.toLowerCase().includes(search))
  })
})

function isActive(conversation: ConversationResponse): boolean {
  return props.activeConversationId === conversation.conversation_id
}

function handleSelectFromModal(conversationId: string): void {
  emit('select', conversationId)
  searchModalOpen.value = false
  modalKeyword.value = ''
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-ppx-standard ease-ppx transition-opacity"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-ppx-fast ease-ppx transition-opacity"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.mobile && props.open"
        class="fixed inset-0 z-45 bg-black/30 lg:hidden"
        @click="emit('toggle')"
      />
    </Transition>
  </Teleport>

  <aside
    class="border-ppx-border bg-ppx-bg duration-ppx-standard ease-ppx flex h-full shrink-0 flex-col border-r transition-all"
    :class="
      props.mobile
        ? [
            'fixed inset-y-0 left-0 z-50 w-[min(18rem,calc(100vw-1rem))] max-w-full shadow-2xl lg:hidden',
            props.open
              ? 'translate-x-0 opacity-100'
              : 'pointer-events-none -translate-x-full opacity-0',
          ]
        : props.collapsed
          ? 'w-15 items-center'
          : 'w-60'
    "
  >
    <ChatSidebarHeader
      :collapsed="Boolean(props.mobile ? false : props.collapsed)"
      @toggle="emit('toggle')"
    />

    <div class="border-ppx-border flex min-h-0 flex-1 flex-col border-t pt-3">
      <SidebarButton
        v-if="!props.collapsed || props.mobile"
        variant="toggle"
        :open="chatsOpen"
        @click="chatsOpen = !chatsOpen"
      >
        {{ t('projects.chatSidebar.sidebarSubtitle') }}
      </SidebarButton>

      <div
        v-show="chatsOpen"
        class="mt-1 flex min-h-0 flex-col space-y-1 overflow-hidden px-2 pb-2"
      >
        <SidebarButton
          variant="action"
          :collapsed="Boolean(props.mobile ? false : props.collapsed)"
          @click="emit('create')"
        >
          <template #icon>
            <MessageSquarePlus class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
          </template>
          {{ t('projects.chatSidebar.newConversationBtn') }}
        </SidebarButton>

        <SidebarButton
          variant="action"
          :collapsed="Boolean(props.mobile ? false : props.collapsed)"
          @click="searchModalOpen = true"
        >
          <template #icon>
            <Search class="text-ppx-text-soft h-4.5 w-4.5 group-hover:text-current" />
          </template>
          {{ t('projects.chatSidebar.searchPlaceholder') }}
        </SidebarButton>

        <template v-if="!props.collapsed || props.mobile">
          <div
            v-if="props.loading && flatItems.length === 0"
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <p class="text-ppx-text-muted text-xs">{{ t('common.loading') }}</p>
          </div>
          <VirtualScrollList
            v-else-if="flatItems.length > 0"
            :items="flatItems"
            :window-size="30"
            :step-size="10"
            key-field="_key"
            class="min-h-0 flex-1"
          >
            <template #default="{ item: entry }">
              <div
                v-if="entry._type === 'group-header'"
                class="text-ppx-text-soft border-ppx-border pt-2.5 pb-1 pl-1 text-xs font-semibold tracking-wide uppercase first:pt-1"
              >
                {{ entry.label }}
              </div>
              <ChatConversationItem
                v-else
                :conversation="entry.conversation"
                :active="isActive(entry.conversation)"
                @select="emit('select', $event)"
              />
            </template>
          </VirtualScrollList>
          <div v-else class="flex flex-col items-center justify-center py-12 text-center">
            <p class="text-ppx-text-muted text-xs">{{ t('projects.chatSidebar.emptyState') }}</p>
          </div>
        </template>
      </div>
    </div>

    <ChatSearchModal
      v-model:keyword="modalKeyword"
      :open="searchModalOpen"
      :results="searchResults"
      @select="handleSelectFromModal"
      @create="emit('create')"
      @close="((searchModalOpen = false), (modalKeyword = ''))"
    />
  </aside>
</template>
