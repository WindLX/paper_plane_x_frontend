import { appConfig } from '@/config'
import type { HITLAnswer, HITLPendingQuestion } from '@/types/api'

export type HitlSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export interface HitlSocketMessage {
  type: 'hitl_question' | 'hitl_answered' | 'error'
  question_id?: string
  project_id?: string | null
  conversation_id?: string | null
  questions?: Array<{
    text: string
    options: Array<{ id: string; text: string }>
    allow_multiple: boolean
    custom_answer_label: string
  }>
  created_at?: number
  detail?: string
}

export class HitlWebSocketClient {
  private ws: WebSocket | null = null
  private status: HitlSocketStatus = 'idle'
  private onQuestionCallback: ((question: HITLPendingQuestion) => void) | null = null
  private onAnsweredCallback: ((questionId: string) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null
  private onStatusChangeCallback: ((status: HitlSocketStatus) => void) | null = null

  constructor() {
    const apiUrl = new URL(appConfig.apiBaseUrl)
    const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    this.wsUrl = `${wsProtocol}//${apiUrl.host}${apiUrl.pathname}/ws/hitl`
  }

  private wsUrl: string

  onQuestion(callback: (question: HITLPendingQuestion) => void): void {
    this.onQuestionCallback = callback
  }

  onAnswered(callback: (questionId: string) => void): void {
    this.onAnsweredCallback = callback
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback
  }

  onStatusChange(callback: (status: HitlSocketStatus) => void): void {
    this.onStatusChangeCallback = callback
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.setStatus('connecting')

    const socket = new WebSocket(this.wsUrl)
    this.ws = socket

    socket.onopen = () => {
      this.setStatus('connected')
    }

    socket.onclose = () => {
      this.setStatus('disconnected')
      this.ws = null
    }

    socket.onerror = () => {
      this.setStatus('error')
      this.onErrorCallback?.('WebSocket connection failed')
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as HitlSocketMessage
        this.handleMessage(data)
      } catch {
        // ignore non-json messages
      }
    }
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
    this.setStatus('idle')
  }

  sendAnswer(questionId: string, answers: HITLAnswer[]): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.onErrorCallback?.('WebSocket not connected')
      return
    }
    this.ws.send(
      JSON.stringify({
        type: 'answer',
        question_id: questionId,
        answers,
      }),
    )
  }

  get currentStatus(): HitlSocketStatus {
    return this.status
  }

  private setStatus(status: HitlSocketStatus): void {
    this.status = status
    this.onStatusChangeCallback?.(status)
  }

  private handleMessage(data: HitlSocketMessage): void {
    switch (data.type) {
      case 'hitl_question': {
        if (data.question_id && data.questions) {
          this.onQuestionCallback?.({
            question_id: data.question_id,
            project_id: data.project_id ?? null,
            conversation_id: data.conversation_id ?? null,
            questions: data.questions.map((q) => ({
              text: q.text,
              options: q.options,
              allow_multiple: q.allow_multiple,
              custom_answer_label: q.custom_answer_label,
            })),
            created_at: data.created_at ?? 0,
          })
        }
        break
      }
      case 'hitl_answered': {
        if (data.question_id) {
          this.onAnsweredCallback?.(data.question_id)
        }
        break
      }
      case 'error': {
        this.onErrorCallback?.(data.detail || 'Unknown HITL error')
        break
      }
    }
  }
}

export const hitlApi = {
  createWebSocketClient(): HitlWebSocketClient {
    return new HitlWebSocketClient()
  },
}
