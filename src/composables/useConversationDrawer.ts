import { reactive, ref } from 'vue'

import { api } from '@/api'
import { useConversationStore } from '@/stores/conversation'
import type {
  AgentTraceResponse,
  ConversationResponse,
  ConversationTurnResponse,
} from '@/types/api'

export interface ConversationDrawerData {
  conversation: ConversationResponse | null
  turns: ConversationTurnResponse[]
  traces: Record<string, AgentTraceResponse>
}

function createEmptyDrawerData(): ConversationDrawerData {
  return { conversation: null, turns: [], traces: {} }
}

export function useConversationDrawer() {
  const chatStore = useConversationStore()

  const drawerOpen = ref(false)
  const drawerData = ref<ConversationDrawerData>(createEmptyDrawerData())
  const scrollToTurnId = ref<string | null>(null)
  const selectedPaperId = ref<string | null>(null)
  const selectedPaperNonce = ref(0)

  async function loadDrawerContent(): Promise<void> {
    const conversationId = chatStore.currentConversationId
    if (!conversationId) return

    drawerOpen.value = true

    try {
      const [conversation, turns] = await Promise.all([
        api.getConversation(conversationId),
        api.listTurns(conversationId),
      ])

      const traceIds = Array.from(new Set(turns.flatMap((turn) => turn.trace_ids)))
      const traces: Record<string, AgentTraceResponse> = {}

      if (traceIds.length > 0) {
        const traceResponse = await api.queryAgentTraces(traceIds)
        for (const trace of traceResponse.items) {
          traces[trace.trace_id] = trace
        }
      }

      drawerData.value = {
        conversation,
        turns,
        traces,
      }
    } catch (error) {
      console.error(error)
      drawerData.value = createEmptyDrawerData()
    }
  }

  function handleScrollToTurn(turnId: string): void {
    scrollToTurnId.value = turnId
  }

  async function openDrawer(): Promise<void> {
    selectedPaperId.value = null
    await loadDrawerContent()
  }

  function closeDrawer(): void {
    drawerOpen.value = false
    selectedPaperId.value = null
    drawerData.value = createEmptyDrawerData()
  }

  async function openDrawerPaper(paperId: string): Promise<void> {
    selectedPaperId.value = paperId
    selectedPaperNonce.value += 1
    await loadDrawerContent()
  }

  async function toggleDrawer(): Promise<void> {
    if (drawerOpen.value) {
      closeDrawer()
    } else {
      await openDrawer()
    }
  }

  return reactive({
    drawerOpen,
    drawerData,
    scrollToTurnId,
    selectedPaperId,
    selectedPaperNonce,
    handleScrollToTurn,
    openDrawer,
    closeDrawer,
    openDrawerPaper,
    toggleDrawer,
  })
}
