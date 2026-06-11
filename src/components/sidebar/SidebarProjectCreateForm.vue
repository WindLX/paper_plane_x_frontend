<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import AppModalShell from '../AppModalShell.vue'
import { useNotify } from '@/composables/useNotify'

const name = ref('')
const description = ref('')

const props = defineProps<{
  open: boolean
  submitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [[name: string, description: string | null]]
}>()

const { t } = useI18n()
const notify = useNotify()

async function submit(): Promise<void> {
  if (!name.value.trim()) {
    notify.push(t('sidebar.project.error.createValidationNameRequired'), 'error', 3600)
    return
  }
  emit('submit', [name.value.trim(), description.value.trim() || null])
  name.value = ''
  description.value = ''
}
</script>

<template>
  <AppModalShell
    :open="props.open"
    :title="t('sidebar.project.createModalTitle')"
    width-class="max-w-2xl"
    z-index="z-[80]"
    @close="emit('close')"
  >
    <form class="grid gap-4 md:grid-cols-1" @submit.prevent="submit">
      <label class="block">
        <span class="workspace-label">{{ t('sidebar.project.createFieldName') }}</span>
        <input
          v-model="name"
          type="text"
          :placeholder="t('sidebar.project.createFieldNamePlaceholder')"
          class="workspace-input"
        />
      </label>
      <label class="block">
        <span class="workspace-label">{{ t('sidebar.project.createFieldDescription') }}</span>
        <input
          v-model="description"
          type="text"
          :placeholder="t('sidebar.project.createFieldDescriptionPlaceholder')"
          class="workspace-input"
        />
      </label>
      <div class="flex justify-end">
        <AppButton type="submit" :disabled="props.submitting" tone="sky" variant="solid" size="md">
          <Plus class="h-4 w-4" />
          <span>{{ t('sidebar.project.createSubmit') }}</span>
        </AppButton>
      </div>
    </form>
  </AppModalShell>
</template>
