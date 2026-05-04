<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '../AppButton.vue'
import FormTextField from './project-form/FormTextField.vue'

const props = defineProps<{
  onCreate: (name: string, description: string | null) => Promise<void>
}>()

const { t } = useI18n()
const name = ref('')
const description = ref('')
const submitting = ref(false)

async function submit(): Promise<void> {
  if (!name.value.trim()) return
  submitting.value = true
  try {
    await props.onCreate(name.value.trim(), description.value.trim() || null)
    name.value = ''
    description.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="grid gap-4 md:grid-cols-1" @submit.prevent="submit">
    <FormTextField
      v-model="name"
      :label="t('projects.fields.name')"
      :placeholder="t('projects.namePlaceholder')"
    />
    <FormTextField
      v-model="description"
      :label="t('projects.fields.description')"
      :placeholder="t('projects.descriptionPlaceholder')"
    />
    <div class="flex justify-end">
      <AppButton type="submit" :disabled="submitting" tone="sky" variant="solid" size="md">
        <Plus class="h-4 w-4" />
        <span>{{ t('actions.create') }}</span>
      </AppButton>
    </div>
  </form>
</template>
