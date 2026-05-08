<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import type { HITLPendingQuestion, HITLAnswer } from '@/types/api'

const props = defineProps<{
  question: HITLPendingQuestion
}>()

const emit = defineEmits<{
  submit: [answers: HITLAnswer[]]
}>()

const { t } = useI18n()

const panelExpanded = ref(true)
const expandedQuestions = ref<Record<number, boolean>>({})
const selectedOptions = ref<Record<number, string[]>>({})
const customTexts = ref<Record<number, string>>({})

watch(
  () => props.question.question_id,
  () => {
    panelExpanded.value = true
    expandedQuestions.value = { 0: true }
    selectedOptions.value = {}
    customTexts.value = {}
  },
  { immediate: true },
)

function togglePanel(): void {
  panelExpanded.value = !panelExpanded.value
}

function toggleQuestion(questionIndex: number): void {
  expandedQuestions.value[questionIndex] = !expandedQuestions.value[questionIndex]
}

function isQuestionExpanded(questionIndex: number): boolean {
  return expandedQuestions.value[questionIndex] ?? false
}

function toggleOption(questionIndex: number, optionId: string, allowMultiple: boolean): void {
  const current = selectedOptions.value[questionIndex] ?? []
  if (allowMultiple) {
    if (current.includes(optionId)) {
      selectedOptions.value[questionIndex] = current.filter((id) => id !== optionId)
    } else {
      selectedOptions.value[questionIndex] = [...current, optionId]
    }
  } else {
    selectedOptions.value[questionIndex] = current.includes(optionId) ? [] : [optionId]
  }
}

function isSelected(questionIndex: number, optionId: string): boolean {
  return (selectedOptions.value[questionIndex] ?? []).includes(optionId)
}

function isAnswered(questionIndex: number): boolean {
  const selected = selectedOptions.value[questionIndex] ?? []
  if (selected.length > 0) return true
  return Boolean(customTexts.value[questionIndex]?.trim())
}

function canSubmit(): boolean {
  return props.question.questions.every((q, idx) => {
    const selected = selectedOptions.value[idx] ?? []
    if (selected.length > 0) return true
    const custom = customTexts.value[idx]?.trim()
    if (custom) return true
    return false
  })
}

function handleSubmit(): void {
  const answers: HITLAnswer[] = props.question.questions.map((q, idx) => ({
    question_index: idx,
    selected_option_ids: selectedOptions.value[idx] ?? [],
    custom_text: customTexts.value[idx]?.trim() || null,
  }))
  emit('submit', answers)
}
</script>

<template>
  <article class="workspace-panel animate-fade-in-up mx-auto flex max-h-[42vh] max-w-2xl flex-col space-y-3 p-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <div class="workspace-section-icon">
          <span class="text-ppx-text-soft text-xs font-bold">?️</span>
        </div>
        <h3 class="workspace-section-title">{{ t('projects.hitl.title') }}</h3>
        <span class="text-ppx-text-muted text-xs">
          {{ question.questions.length }}
        </span>
      </div>

      <button
        type="button"
        class="rounded-ppx-interactive border-ppx-border-strong hover:bg-ppx-bg-elevated px-2 py-1 text-xs"
        @click="togglePanel"
      >
        {{ panelExpanded ? '收起' : '展开' }}
      </button>
    </div>

    <div v-if="panelExpanded" class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      <section
        v-for="(q, qIdx) in question.questions"
        :key="qIdx"
        class="workspace-subpanel space-y-2 p-3"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 text-left"
          @click="toggleQuestion(qIdx)"
        >
          <p class="text-ppx-text min-w-0 text-sm font-medium">
            {{ q.text }}
          </p>
          <div class="flex shrink-0 items-center gap-2">
            <span
              class="rounded border px-1.5 py-0.5 text-[11px]"
              :class="isAnswered(qIdx) ? 'border-emerald-400/60 text-emerald-600' : 'border-ppx-border-strong text-ppx-text-muted'"
            >
              {{ isAnswered(qIdx) ? '已答' : '待答' }}
            </span>
            <span class="text-ppx-text-muted text-xs">{{ isQuestionExpanded(qIdx) ? '▾' : '▸' }}</span>
          </div>
        </button>

        <div v-if="isQuestionExpanded(qIdx)" class="space-y-2">
          <div class="space-y-1.5">
            <button
              v-for="opt in q.options"
              :key="opt.id"
              type="button"
              class="rounded-ppx-interactive flex w-full items-center gap-2 border px-3 py-2 text-left text-sm transition-colors"
              :class="
                isSelected(qIdx, opt.id)
                  ? 'border-ppx-accent bg-ppx-accent-soft/40 text-ppx-accent font-medium'
                  : 'border-ppx-border-strong hover:bg-ppx-bg-elevated text-ppx-text'
              "
              @click="toggleOption(qIdx, opt.id, q.allow_multiple)"
            >
              <span
                class="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                :class="
                  isSelected(qIdx, opt.id)
                    ? 'border-ppx-accent bg-ppx-accent'
                    : 'border-ppx-border-strong'
                "
              >
                <span
                  v-if="isSelected(qIdx, opt.id)"
                  class="block h-2 w-2 rounded-sm bg-white"
                />
              </span>
              <span class="min-w-0 truncate">{{ opt.text }}</span>
            </button>
          </div>

          <div v-if="q.custom_answer_label" class="pt-1">
            <label class="workspace-label mb-1">{{ q.custom_answer_label }}</label>
            <input
              v-model="customTexts[qIdx]"
              type="text"
              class="workspace-input"
              :placeholder="t('projects.hitl.customAnswer')"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-if="panelExpanded" class="flex justify-end pt-1">
      <AppButton variant="solid" size="sm" :disabled="!canSubmit()" @click="handleSubmit">
        {{ t('projects.hitl.submit') }}
      </AppButton>
    </div>
  </article>
</template>
