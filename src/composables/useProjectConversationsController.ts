import { computed, reactive, ref, watch, type Ref } from 'vue'

import { useConversationStore } from '@/stores/conversation'

export function useProjectConversationsController(projectId: Ref<string>) {
  const conversationStore = useConversationStore()

  const sidebarOpen = ref(true)

  const conversations = computed(() =>
    projectId.value ? conversationStore.projectConversations(projectId.value) : [],
  )

  const activeConversationId = computed(() => {
    const currentConversation = conversationStore.currentConversation
    if (!currentConversation || currentConversation.project_id !== projectId.value) {
      return null
    }
    return currentConversation.conversation_id
  })

  const loading = computed(
    () => (projectId.value ? conversationStore.loadingProjectLists[projectId.value] : false) ?? false,
  )

  watch(
    projectId,
    async (nextProjectId, previousProjectId) => {
      if (!nextProjectId) return

      const currentConversation = conversationStore.currentConversation
      if (previousProjectId && currentConversation?.project_id !== nextProjectId) {
        conversationStore.clearCurrentConversation()
      }

      await conversationStore.loadConversations(nextProjectId)
    },
    { immediate: true },
  )

  async function selectConversation(conversationId: string): Promise<void> {
    await conversationStore.selectConversation(conversationId)
  }

  async function createConversation(title?: string): Promise<void> {
    if (!projectId.value) return
    await conversationStore.createConversation(projectId.value, title)
  }

  return reactive({
    sidebarOpen,
    conversations,
    activeConversationId,
    loading,
    selectConversation,
    createConversation,
  })
}
