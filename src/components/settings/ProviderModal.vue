<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import AppModalShell from '@/components/AppModalShell.vue'
import type { LLMProvider, LLMProviderCreateRequest, LLMProviderUpdateRequest } from '@/types/api'

const props = defineProps<{
  open: boolean
  editingProvider: LLMProvider | null
}>()

const emit = defineEmits<{
  close: []
  save: [payload: (LLMProviderCreateRequest | LLMProviderUpdateRequest) & { name?: string }]
}>()

const { t } = useI18n()

interface ProviderFormData {
  name: string
  model: string
  base_url: string
  api_key: string
}

const providerForm = ref<ProviderFormData>({
  name: '',
  model: '',
  base_url: '',
  api_key: '',
})
const showKey = ref(false)
const isEditing = computed(() => props.editingProvider !== null)
const hasExistingKey = computed(() => props.editingProvider?.has_api_key ?? false)

// When editing, leave api_key empty — backend persists the existing key when none is sent.
// When creating, api_key starts empty and the user fills it in.
function initForm() {
  if (props.editingProvider) {
    providerForm.value = {
      name: props.editingProvider.name,
      model: props.editingProvider.model,
      base_url: props.editingProvider.base_url ?? '',
      api_key: '',
    }
  } else {
    providerForm.value = {
      name: 'deepseek-pro',
      model: 'deepseek-v4-pro',
      base_url: 'https://api.deepseek.com/v1',
      api_key: '',
    }
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    initForm()
  },
  { immediate: true },
)

function onSave() {
  if (isEditing.value) {
    const { name, ...rest } = providerForm.value
    // If api_key is empty, omit it so the backend keeps the existing one.
    const payload: LLMProviderUpdateRequest & { name?: string } = {
      ...rest,
      name,
    }
    if (!payload.api_key) {
      delete payload.api_key
    }
    emit('save', payload)
  } else {
    emit('save', { ...providerForm.value })
  }
}
</script>

<template>
  <AppModalShell
    :open="open"
    :title="isEditing ? t('settings.providers.edit') : t('settings.providers.add')"
    width-class="max-w-lg"
    @close="emit('close')"
  >
    <div class="animate-fade-in-up space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="workspace-label">{{ t('settings.providers.name') }}</label>
          <input v-model="providerForm.name" class="workspace-input" />
        </div>
        <div>
          <label class="workspace-label">{{ t('settings.providers.model') }}</label>
          <input v-model="providerForm.model" class="workspace-input" />
        </div>
      </div>
      <div>
        <label class="workspace-label">{{ t('settings.providers.baseUrl') }}</label>
        <input v-model="providerForm.base_url" class="workspace-input" />
      </div>
      <div>
        <label class="workspace-label">{{ t('settings.providers.apiKey') }}</label>
        <p v-if="hasExistingKey" class="text-ppx-text-soft mb-1 text-xs">
          {{ t('settings.providers.apiKeySaved') }}
        </p>
        <div class="relative">
          <input
            v-model="providerForm.api_key"
            :type="showKey ? 'text' : 'password'"
            :placeholder="hasExistingKey ? t('settings.providers.apiKeyPlaceholder') : ''"
            class="workspace-input pr-10"
          />
          <AppButton
            size="xs"
            variant="transparent"
            class="absolute inset-y-0 right-0"
            @click="showKey = !showKey"
          >
            <Eye v-if="!showKey" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </AppButton>
        </div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <AppButton size="sm" variant="outline" @click="emit('close')">
          {{ t('settings.providers.cancel') }}
        </AppButton>
        <AppButton size="sm" variant="solid" @click="onSave">
          {{ t('settings.providers.save') }}
        </AppButton>
      </div>
    </div>
  </AppModalShell>
</template>
