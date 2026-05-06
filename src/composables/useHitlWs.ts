import { computed } from 'vue'

import { useHitlWsStore } from '@/stores/hitlWs'
import type { HITLAnswer } from '@/types/api'

export function useHitlWs(conversationId: () => string | null | undefined) {
  const hitlWsStore = useHitlWsStore()

  function answerQuestion(questionId: string, answers: HITLAnswer[]): void {
    hitlWsStore.answerQuestion(questionId, answers)
  }

  const currentQuestion = computed(() => hitlWsStore.questionForConversation(conversationId()))

  return {
    status: hitlWsStore.status,
    pendingQuestions: hitlWsStore.pendingQuestions,
    currentQuestion,
    error: hitlWsStore.error,
    answerQuestion,
  }
}
