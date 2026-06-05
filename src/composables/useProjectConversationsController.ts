import { computed, reactive, ref, watch, type Ref } from 'vue'

import { useMediaQuery } from '@/composables/useMediaQuery'
import { useConversationStore } from '@/stores/conversation'

export function useProjectConversationsController(projectId: Ref<string>) {
  const conversationStore = useConversationStore()
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const sidebarOpen = ref(false)

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
    () =>
      (projectId.value ? conversationStore.loadingProjectLists[projectId.value] : false) ?? false,
  )

  watch(
    isMobile,
    (nextIsMobile) => {
      sidebarOpen.value = !nextIsMobile
    },
    { immediate: true },
  )

  watch(
    projectId,
    async (nextProjectId) => {
      if (!nextProjectId) return

      const currentConversation = conversationStore.currentConversation
      if (currentConversation && currentConversation.project_id !== nextProjectId) {
        conversationStore.clearCurrentConversation()
      }

      await conversationStore.loadConversations(nextProjectId)
    },
    { immediate: true },
  )

  async function selectConversation(conversationId: string): Promise<void> {
    await conversationStore.selectConversation(conversationId)
    if (isMobile.value) {
      sidebarOpen.value = false
    }
  }

  async function createConversation(title?: string): Promise<void> {
    if (!projectId.value) return
    await conversationStore.createConversation(projectId.value, title)
    if (isMobile.value) {
      sidebarOpen.value = false
    }
  }

  function openSidebar(): void {
    sidebarOpen.value = true
  }

  function closeSidebar(): void {
    sidebarOpen.value = false
  }

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value
  }

  return reactive({
    isMobile,
    sidebarOpen,
    conversations,
    activeConversationId,
    loading,
    selectConversation,
    createConversation,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  })
}
