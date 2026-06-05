<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import AppModalShell from '@/components/AppModalShell.vue'
import AppSelect from '@/components/AppSelect.vue'
import type { AgentLLMConfig, LLMProvider } from '@/types/api'

const props = defineProps<{
  open: boolean
  editingAgent: AgentLLMConfig | null
  providers: LLMProvider[]
}>()

const emit = defineEmits<{
  close: []
  save: [
    [
      agentName: string,
      payload: {
        provider_name: string
        temperature?: number | null
        max_tokens?: number | null
        timeout?: number | null
        thinking_enabled?: boolean | null
        reasoning_effort?: string | null
        extra_body?: Record<string, unknown> | null
        is_vlm?: boolean | null
        short_memory_window?: number | null
      },
    ],
  ]
}>()

const { t } = useI18n()

const agentForm = ref<Partial<AgentLLMConfig>>({})

const extraBodyText = computed({
  get() {
    const val = agentForm.value.extra_body
    if (!val || Object.keys(val).length === 0) return ''
    try {
      return JSON.stringify(val, null, 2)
    } catch {
      return String(val)
    }
  },
  set(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed) {
      agentForm.value.extra_body = null
      return
    }
    try {
      agentForm.value.extra_body = JSON.parse(trimmed) as Record<string, unknown>
    } catch {
      // 保留原值，不做更新
    }
  },
})

const providerOptions = computed(() =>
  props.providers.map((p) => ({ label: p.name, value: p.name })),
)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    if (props.editingAgent) {
      agentForm.value = { ...props.editingAgent }
    } else {
      agentForm.value = {
        agent_name: '',
        provider_name: '',
        temperature: undefined,
        max_tokens: undefined,
        timeout: undefined,
        thinking_enabled: undefined,
        reasoning_effort: undefined,
        extra_body: undefined,
        is_vlm: undefined,
        short_memory_window: undefined,
      } as Partial<AgentLLMConfig>
    }
  },
  { immediate: true },
)

function onSave() {
  if (!props.editingAgent) return
  emit('save', [
    props.editingAgent.agent_name,
    {
      provider_name: agentForm.value.provider_name ?? 'default',
      temperature: agentForm.value.temperature ?? null,
      max_tokens: agentForm.value.max_tokens ?? null,
      timeout: agentForm.value.timeout ?? null,
      thinking_enabled: agentForm.value.thinking_enabled ?? null,
      reasoning_effort: agentForm.value.reasoning_effort ?? null,
      extra_body: agentForm.value.extra_body ?? null,
      is_vlm: agentForm.value.is_vlm ?? null,
      short_memory_window: agentForm.value.short_memory_window ?? null,
    },
  ])
}
</script>

<template>
  <AppModalShell
    :open="open"
    :title="editingAgent ? editingAgent.agent_name : ''"
    width-class="max-w-lg"
    @close="emit('close')"
  >
    <div class="animate-fade-in-up space-y-4">
      <div>
        <label class="workspace-label">{{ t('settings.agents.provider') }}</label>
        <AppSelect v-model="agentForm.provider_name" :options="providerOptions" />
      </div>
      <div class="grid grid-cols-4 gap-3">
        <div>
          <label class="workspace-label">{{ t('settings.agents.temperature') }}</label>
          <input
            v-model.number="agentForm.temperature"
            type="number"
            step="0.1"
            class="workspace-input"
          />
        </div>
        <div>
          <label class="workspace-label">{{ t('settings.agents.maxTokens') }}</label>
          <input v-model.number="agentForm.max_tokens" type="number" class="workspace-input" />
        </div>
        <div>
          <label class="workspace-label">{{ t('settings.agents.timeout') }}</label>
          <input v-model.number="agentForm.timeout" type="number" class="workspace-input" />
        </div>
        <div>
          <label class="workspace-label">{{ t('settings.agents.shortMemoryWindow') }}</label>
          <input
            v-model.number="agentForm.short_memory_window"
            type="number"
            min="1"
            class="workspace-input"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="workspace-label">{{ t('settings.agents.thinking') }}</label>
          <AppSelect
            v-model="agentForm.thinking_enabled"
            :options="[
              { label: '-', value: null },
              { label: t('settings.agents.yes'), value: true },
              { label: t('settings.agents.no'), value: false },
            ]"
          />
        </div>
        <div>
          <label class="workspace-label">{{ t('settings.agents.isVlm') }}</label>
          <AppSelect
            v-model="agentForm.is_vlm"
            :options="[
              { label: '-', value: null },
              { label: t('settings.agents.yes'), value: true },
              { label: t('settings.agents.no'), value: false },
            ]"
          />
        </div>
      </div>
      <div>
        <label class="workspace-label">{{ t('settings.agents.reasoningEffort') }}</label>
        <input v-model="agentForm.reasoning_effort" class="workspace-input" />
      </div>
      <div>
        <label class="workspace-label">{{ t('settings.agents.extraBody') }}</label>
        <textarea
          v-model="extraBodyText"
          rows="3"
          class="workspace-input font-mono text-xs"
          placeholder='{"thinking": {"type": "enabled"}}'
        />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <AppButton size="sm" variant="outline" @click="emit('close')">
          {{ t('dialog.cancel') }}
        </AppButton>
        <AppButton size="sm" variant="solid" @click="onSave">
          {{ t('settings.agents.save') }}
        </AppButton>
      </div>
    </div>
  </AppModalShell>
</template>
