import { ref, shallowRef } from 'vue'

import { hitlApi } from '@/api/hitl'
import type { HITLAnswer, HITLPendingQuestion } from '@/types/api'

export type HitlSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export function useHitlSocket() {
  const client = shallowRef(hitlApi.createWebSocketClient())
  const status = ref<HitlSocketStatus>('idle')
  const pendingQuestions = ref<HITLPendingQuestion[]>([])
  const error = ref<string | null>(null)

  function connect(): void {
    if (client.value.currentStatus === 'connected') return

    // Create new client if needed
    if (client.value.currentStatus === 'disconnected' || client.value.currentStatus === 'error') {
      client.value = hitlApi.createWebSocketClient()
    }

    client.value.onStatusChange((s) => {
      status.value = s
    })

    client.value.onQuestion((question) => {
      // Replace existing question with same id or add new
      const idx = pendingQuestions.value.findIndex((q) => q.question_id === question.question_id)
      if (idx !== -1) {
        pendingQuestions.value[idx] = question
      } else {
        pendingQuestions.value.push(question)
      }
    })

    client.value.onAnswered((questionId) => {
      pendingQuestions.value = pendingQuestions.value.filter((q) => q.question_id !== questionId)
    })

    client.value.onError((err) => {
      error.value = err
    })

    client.value.connect()
  }

  function disconnect(): void {
    client.value.disconnect()
    pendingQuestions.value = []
    error.value = null
  }

  function answerQuestion(questionId: string, answers: HITLAnswer[]): void {
    client.value.sendAnswer(questionId, answers)
  }

  return {
    status,
    pendingQuestions,
    error,
    connect,
    disconnect,
    answerQuestion,
  }
}
