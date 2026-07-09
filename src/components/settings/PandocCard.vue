<script setup lang="ts">
import { computed } from 'vue'
import { FileText } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import SettingsCard from '@/components/settings/SettingsCard.vue'
import type { SettingsController } from '@/composables/useSettingsController'

const { t } = useI18n()
const props = defineProps<{
  ctrl: SettingsController
}>()

const pandocPath = computed({
  get: () => props.ctrl.appSettings!.pandoc.pandoc_path ?? '',
  set: (value: string) => {
    props.ctrl.appSettings!.pandoc.pandoc_path = value
  },
})

const htmlTemplate = computed({
  get: () => props.ctrl.appSettings!.pandoc.html_template ?? '',
  set: (value: string) => {
    props.ctrl.appSettings!.pandoc.html_template = value
  },
})

const pdfEngine = computed({
  get: () => props.ctrl.appSettings!.pandoc.pdf_engine ?? '',
  set: (value: string) => {
    props.ctrl.appSettings!.pandoc.pdf_engine = value
  },
})

function onSave() {
  const path = pandocPath.value.trim()
  const template = htmlTemplate.value.trim()
  const engine = pdfEngine.value.trim()
  props.ctrl.updatePandocConfig({
    pandoc_path: path || null,
    html_template: template || null,
    pdf_engine: engine || null,
  })
}
</script>

<template>
  <SettingsCard
    :title="t('settings.appSettings.pandoc.title')"
    :body="t('settings.appSettings.pandoc.body')"
    :icon="FileText"
    :action-label="t('settings.appSettings.save')"
    :loading="props.ctrl.saving"
    @action="onSave"
  >
    <div>
      <label class="workspace-label">{{ t('settings.appSettings.pandoc.path') }}</label>
      <input
        v-model="pandocPath"
        class="workspace-input"
        :placeholder="t('settings.appSettings.pandoc.pathPlaceholder')"
      />
    </div>

    <div>
      <label class="workspace-label">{{ t('settings.appSettings.pandoc.htmlTemplate') }}</label>
      <input
        v-model="htmlTemplate"
        class="workspace-input"
        :placeholder="t('settings.appSettings.pandoc.htmlTemplatePlaceholder')"
      />
    </div>

    <div>
      <label class="workspace-label">{{ t('settings.appSettings.pandoc.pdfEngine') }}</label>
      <input
        v-model="pdfEngine"
        class="workspace-input"
        :placeholder="t('settings.appSettings.pandoc.pdfEnginePlaceholder')"
      />
    </div>
  </SettingsCard>
</template>
