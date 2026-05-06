<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import AppSelect from '@/components/AppSelect.vue'
import { ALL_FIELDS } from '@/constants/export'
import type { ProjectExportField } from '@/types/api'

defineProps<{
  exporting: boolean
}>()

const emit = defineEmits<{
  export: [payload: { fields: ProjectExportField[]; citationsMode: 'keep' | 'strip' }]
}>()

const { t } = useI18n()

const selectedFields = defineModel<ProjectExportField[]>('selectedFields', {
  default: () => [...ALL_FIELDS],
})
const citationsMode = defineModel<'keep' | 'strip'>('citationsMode', { default: 'keep' })

function toggleField(field: ProjectExportField): void {
  const idx = selectedFields.value.indexOf(field)
  if (idx >= 0) {
    selectedFields.value.splice(idx, 1)
  } else {
    selectedFields.value.push(field)
  }
}

function selectAll(): void {
  selectedFields.value = [...ALL_FIELDS]
}

function clearAll(): void {
  selectedFields.value = []
}

function handleExport(): void {
  if (selectedFields.value.length === 0) return
  emit('export', { fields: selectedFields.value, citationsMode: citationsMode.value })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="text-ppx-text text-sm font-semibold">
        {{ t('projects.exportFieldsTitle') }}
      </h4>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="text-ppx-text-soft text-xs underline underline-offset-2"
          @click="selectAll"
        >
          {{ t('projects.selectAllFields') }}
        </button>
        <button
          type="button"
          class="text-ppx-text-soft text-xs underline underline-offset-2"
          @click="clearAll"
        >
          {{ t('projects.actions.clear') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-x-2 gap-y-1.5">
      <label
        v-for="field in ALL_FIELDS"
        :key="field"
        class="rounded-ppx-interactive duration-ppx-fast flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-colors"
        :class="
          selectedFields.includes(field)
            ? 'border-ppx-accent bg-ppx-accent-soft/40 text-ppx-accent'
            : 'border-ppx-border bg-ppx-bg-elevated text-ppx-text-soft hover:bg-ppx-bg-subtle'
        "
      >
        <input
          type="checkbox"
          :checked="selectedFields.includes(field)"
          class="accent-ppx-accent h-3.5 w-3.5"
          @change="toggleField(field)"
        />
        <span class="truncate">{{ t(`paper.exportFields.${field}`) || field }}</span>
      </label>
    </div>

    <div class="space-y-2">
      <label class="workspace-label">{{ t('projects.citations') }}</label>
      <AppSelect
        v-model="citationsMode"
        :options="[
          { label: t('projects.keepCitations'), value: 'keep' },
          { label: t('projects.stripCitations'), value: 'strip' },
        ]"
      />
    </div>

    <AppButton
      variant="solid"
      tone="sky"
      block
      :loading="exporting"
      :disabled="selectedFields.length === 0"
      @click="handleExport"
    >
      <Download class="h-4 w-4" />
      <span>
        {{
          exporting
            ? t('projects.exporting')
            : `${t('projects.export')} (${selectedFields.length})`
        }}
      </span>
    </AppButton>
  </div>
</template>
