import { ref } from 'vue'

import { api } from '@/api'
import type { HITLAnswer, HITLPendingQuestion } from '@/types/api'

export type HitlStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export function useHitl() {
  const status = ref<HitlStatus>('idle')
  const currentQuestion = ref<HITLPendingQuestion | null>(null)
  const error = ref<string | null>(null)

  let client: ReturnType<typeof api.createWebSocketClient> | null = null

  function connect(): void {
    if (client?.currentStatus === 'connected') return

    client = api.createWebSocketClient()

    client.onStatusChange((s) => {
      status.value = s
    })

    client.onQuestion((q) => {
      currentQuestion.value = q
      error.value = null
    })

    client.onAnswered(() => {
      currentQuestion.value = null
    })

    client.onError((err) => {
      error.value = err
    })

    client.connect()
  }

  function disconnect(): void {
    client?.disconnect()
    client = null
    status.value = 'idle'
    currentQuestion.value = null
    error.value = null
  }

  function submitAnswer(answers: HITLAnswer[]): void {
    if (!client || !currentQuestion.value) return
    client.sendAnswer(currentQuestion.value.question_id, answers)
  }

  return {
    status,
    currentQuestion,
    error,
    connect,
    disconnect,
    submitAnswer,
  }
}
