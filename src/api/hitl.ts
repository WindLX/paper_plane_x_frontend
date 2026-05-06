import { BaseWebSocketClient, type WebSocketStatus } from './ws'
import type { HITLAnswer, HITLPendingQuestion } from '@/types/api'

export type HitlSocketStatus = WebSocketStatus

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

export class HitlWebSocketClient extends BaseWebSocketClient<HitlSocketMessage> {
  private onQuestionCallback: ((question: HITLPendingQuestion) => void) | null = null
  private onAnsweredCallback: ((questionId: string) => void) | null = null

  constructor() {
    super({
      path: '/ws/hitl',
    })

    this.onMessage((data) => {
      this.handleMessage(data)
    })
  }

  onQuestion(callback: (question: HITLPendingQuestion) => void): void {
    this.onQuestionCallback = callback
  }

  onAnswered(callback: (questionId: string) => void): void {
    this.onAnsweredCallback = callback
  }

  sendAnswer(questionId: string, answers: HITLAnswer[]): void {
    this.sendJson({
      type: 'answer',
      question_id: questionId,
      answers,
    })
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
        this.reportError(data.detail || 'Unknown HITL error')
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
