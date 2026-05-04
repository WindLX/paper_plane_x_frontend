<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import AppModalShell from '@/components/AppModalShell.vue'
import type { LLMProvider } from '@/types/api'

const props = defineProps<{
  open: boolean
  editingProvider: LLMProvider | null
}>()

const emit = defineEmits<{
  close: []
  save: [payload: LLMProvider]
}>()

const { t } = useI18n()

const providerForm = ref<Partial<LLMProvider>>({})
const showKey = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    if (props.editingProvider) {
      providerForm.value = { ...props.editingProvider }
    } else {
      providerForm.value = {
        name: 'deepseek-pro',
        model: 'deepseek-v4-pro',
        base_url: '',
        api_key: '',
      }
    }
  },
  { immediate: true },
)

function onSave() {
  emit('save', providerForm.value as LLMProvider)
}
</script>

<template>
  <AppModalShell
    :open="open"
    :title="editingProvider ? t('settings.providers.edit') : t('settings.providers.add')"
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
        <div class="relative">
          <input
            v-model="providerForm.api_key"
            :type="showKey ? 'text' : 'password'"
            class="workspace-input pr-10"
          />
          <button
            type="button"
            class="text-ppx-text-muted hover:text-ppx-text absolute inset-y-0 right-0 flex cursor-pointer items-center px-3"
            @click="showKey = !showKey"
          >
            <Eye v-if="!showKey" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
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
