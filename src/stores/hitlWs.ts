import { defineStore } from 'pinia'
import { computed, reactive, ref, shallowRef } from 'vue'

import { hitlApi, type HitlSocketStatus } from '@/api/hitl'
import { translate } from '@/i18n'
import { router } from '@/router'
import { useNotify } from '@/composables/useNotify'
import type { HITLAnswer, HITLPendingQuestion } from '@/types/api'

import { useConversationStore } from './conversation'
import { useProjectStore } from './projects'

export const useHitlWsStore = defineStore('hitlWs', () => {
  const notify = useNotify()
  const projectStore = useProjectStore()
  const conversationStore = useConversationStore()

  const client = shallowRef<ReturnType<typeof hitlApi.createWebSocketClient> | null>(null)
  const pendingQuestionsById = reactive<Record<string, HITLPendingQuestion>>({})
  const notifiedQuestionIds = new Set<string>()

  const status = ref<HitlSocketStatus>('idle')
  const error = ref<string | null>(null)
  let reconnectTimer: number | null = null
  let visibilityListenerBound = false
  const pendingQuestions = computed(() =>
    Object.values(pendingQuestionsById).sort((left, right) => left.created_at - right.created_at),
  )

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function scheduleReconnect(): void {
    if (typeof window === 'undefined') return
    if (reconnectTimer !== null) return
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null
      connect()
    }, 1500)
  }

  function bindVisibilityReconnect(): void {
    if (visibilityListenerBound || typeof document === 'undefined') return
    visibilityListenerBound = true
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        connect()
      }
    })
  }

  function currentRouteConversationId(): string | null {
    const route = router.currentRoute.value
    if (route.name !== 'ProjectPage') return null
    const routeProjectId = typeof route.params.projectId === 'string' ? route.params.projectId : null
    const currentConversation = conversationStore.currentConversation
    if (!routeProjectId || !currentConversation) return null
    return currentConversation.project_id === routeProjectId
      ? currentConversation.conversation_id
      : null
  }

  function questionBelongsToCurrentView(question: HITLPendingQuestion): boolean {
    return question.conversation_id !== null && question.conversation_id === currentRouteConversationId()
  }

  function notifyPendingQuestion(question: HITLPendingQuestion): void {
    if (notifiedQuestionIds.has(question.question_id)) return
    if (questionBelongsToCurrentView(question) && typeof document !== 'undefined' && !document.hidden) {
      return
    }

    const conversationTitle = question.conversation_id
      ? conversationStore.conversationsById[question.conversation_id]?.title ?? question.conversation_id
      : translate('projects.hitl.unknownConversation')
    const projectTitle = question.project_id
      ? projectStore.projectsById[question.project_id]?.name ?? question.project_id
      : translate('projects.hitl.unknownProject')

    notify.push(
      translate('projects.hitl.pendingNotification', {
        conversation: conversationTitle,
        project: projectTitle,
      }),
      'warning',
      6000,
    )
    notifiedQuestionIds.add(question.question_id)
  }

  function attachClient(nextClient: ReturnType<typeof hitlApi.createWebSocketClient>): void {
    nextClient.onStatusChange((nextStatus) => {
      status.value = nextStatus
      if (nextStatus === 'connected') {
        clearReconnectTimer()
      }
      if (nextStatus === 'disconnected' || nextStatus === 'error') {
        scheduleReconnect()
      }
    })

    nextClient.onQuestion((question) => {
      pendingQuestionsById[question.question_id] = question
      error.value = null
      notifyPendingQuestion(question)
    })

    nextClient.onAnswered((questionId) => {
      delete pendingQuestionsById[questionId]
      notifiedQuestionIds.delete(questionId)
    })

    nextClient.onError((nextError) => {
      error.value = nextError
      notify.push(
        translate('projects.hitl.socketError', { message: nextError }),
        'error',
        3600,
      )
    })
  }

  function getClient(): ReturnType<typeof hitlApi.createWebSocketClient> {
    const existing = client.value
    if (existing && existing.currentStatus !== 'disconnected' && existing.currentStatus !== 'error') {
      return existing
    }

    const nextClient = hitlApi.createWebSocketClient()
    attachClient(nextClient)
    client.value = nextClient
    return nextClient
  }

  function connect(): void {
    bindVisibilityReconnect()
    const wsClient = getClient()
    if (wsClient.currentStatus === 'idle' || wsClient.currentStatus === 'disconnected') {
      wsClient.connect()
    }
  }

  function disconnect(): void {
    clearReconnectTimer()
    client.value?.disconnect()
    client.value = null
    status.value = 'idle'
    error.value = null
  }

  function answerQuestion(questionId: string, answers: HITLAnswer[]): void {
    connect()
    getClient().sendAnswer(questionId, answers)
  }

  function questionForConversation(conversationId: string | null | undefined): HITLPendingQuestion | null {
    if (!conversationId) return null
    return (
      pendingQuestions.value.find((question) => question.conversation_id === conversationId) ?? null
    )
  }

  return {
    status,
    error,
    pendingQuestions,
    pendingQuestionsById,
    connect,
    disconnect,
    answerQuestion,
    questionForConversation,
  }
})
