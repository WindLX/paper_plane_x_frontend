export interface HITLOption {
  id: string
  text: string
}

export interface HITLQuestion {
  text: string
  options: HITLOption[]
  allow_multiple: boolean
  custom_answer_label: string
}

export interface HITLPendingQuestion {
  question_id: string
  project_id: string | null
  conversation_id: string | null
  questions: HITLQuestion[]
  created_at: number
}

export interface HITLAnswer {
  question_index: number
  selected_option_ids: string[]
  custom_text?: string | null
}

export interface HITLSubmitAnswerPayload {
  type: 'answer'
  question_id: string
  answers: HITLAnswer[]
}
