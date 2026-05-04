<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'

const emit = defineEmits<{
  save: [payload: { name: string | null; description: string | null }]
}>()

const { t } = useI18n()

const name = defineModel<string>('name', { default: '' })
const description = defineModel<string>('description', { default: '' })

function handleSave(): void {
  emit('save', { name: name.value || null, description: description.value || null })
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label class="workspace-label">{{ t('projects.fields.name') }}</label>
      <input v-model="name" class="workspace-input" />
    </div>
    <div class="space-y-2">
      <label class="workspace-label">{{ t('projects.fields.description') }}</label>
      <textarea v-model="description" rows="4" class="workspace-textarea" />
    </div>
    <AppButton variant="solid" tone="sky" block @click="handleSave">
      {{ t('actions.save') }}
    </AppButton>
  </div>
</template>
