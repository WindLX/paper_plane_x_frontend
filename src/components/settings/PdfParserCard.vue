<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FileText } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppSelect from '@/components/AppSelect.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import type { SettingsController } from '@/composables/useSettingsController'
import type { PdfParserType } from '@/types/api'

const { t } = useI18n()
const props = defineProps<{
  ctrl: SettingsController
}>()

const parserType = computed({
  get: () => props.ctrl.appSettings!.pdf_parser.type,
  set: (value: PdfParserType) => {
    props.ctrl.appSettings!.pdf_parser.type = value
  },
})

const cloudApiKey = ref('')

watch(
  () => props.ctrl.appSettings?.pdf_parser.type,
  () => {
    cloudApiKey.value = ''
  },
)

const typeOptions = computed(() => [
  {
    label: t('settings.appSettings.pdfParser.typeLocalMinerU'),
    value: 'local_mineru' as PdfParserType,
  },
  {
    label: t('settings.appSettings.pdfParser.typeCloudMinerU'),
    value: 'cloud_mineru' as PdfParserType,
  },
])

const localConfig = computed(() => props.ctrl.appSettings!.pdf_parser.local)
const cloudConfig = computed(() => props.ctrl.appSettings!.pdf_parser.cloud)

function saveLocalConfig() {
  const { base_url, output_dir } = localConfig.value
  props.ctrl.updatePdfParserLocalConfig({ base_url, output_dir })
}

function saveCloudConfig() {
  const { base_url, model_version, enable_formula, enable_table, is_ocr, language } =
    cloudConfig.value
  props.ctrl.updatePdfParserCloudConfig({
    api_key: cloudApiKey.value || undefined,
    base_url,
    model_version,
    enable_formula,
    enable_table,
    is_ocr,
    language,
  })
}

function onSave() {
  if (parserType.value === 'local_mineru') {
    saveLocalConfig()
  } else {
    saveCloudConfig()
  }
}

const modelVersionOptions = [
  { label: 'pipeline', value: 'pipeline' },
  { label: 'vlm', value: 'vlm' },
  { label: 'MinerU-HTML', value: 'MinerU-HTML' },
]

const currentModelVersion = computed({
  get: () => cloudConfig.value.model_version,
  set: (value: string) => {
    cloudConfig.value.model_version = value
  },
})
</script>

<template>
  <SettingsCard
    :title="t('settings.appSettings.pdfParser.title')"
    :body="t('settings.appSettings.pdfParser.body')"
    :icon="FileText"
    :action-label="t('settings.appSettings.save')"
    :loading="props.ctrl.saving"
    @action="onSave"
  >
    <div>
      <label class="workspace-label">{{ t('settings.appSettings.pdfParser.type') }}</label>
      <AppSelect v-model="parserType" :options="typeOptions" />
    </div>

    <!-- Local MinerU -->
    <template v-if="parserType === 'local_mineru'">
      <div>
        <label class="workspace-label">{{ t('settings.providers.baseUrl') }}</label>
        <input v-model="localConfig.base_url" class="workspace-input" />
      </div>
      <div>
        <label class="workspace-label">{{ t('settings.appSettings.pdfParser.outputDir') }}</label>
        <input v-model="localConfig.output_dir" class="workspace-input" />
      </div>
    </template>

    <!-- Cloud MinerU -->
    <template v-else>
      <div>
        <label class="workspace-label">{{ t('settings.appSettings.pdfParser.apiKey') }}</label>
        <input
          v-model="cloudApiKey"
          type="password"
          class="workspace-input"
          :placeholder="t('settings.appSettings.pdfParser.apiKeySaved')"
        />
      </div>
      <div>
        <label class="workspace-label">{{ t('settings.providers.baseUrl') }}</label>
        <input v-model="cloudConfig.base_url" class="workspace-input" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="workspace-label">{{
            t('settings.appSettings.pdfParser.modelVersion')
          }}</label>
          <AppSelect v-model="currentModelVersion" :options="modelVersionOptions" />
        </div>
        <div>
          <label class="workspace-label">{{ t('settings.appSettings.pdfParser.language') }}</label>
          <input v-model="cloudConfig.language" class="workspace-input" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex items-center gap-2 text-sm">
          <input v-model="cloudConfig.enable_formula" type="checkbox" />
          <span>{{ t('settings.appSettings.pdfParser.enableFormula') }}</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="cloudConfig.enable_table" type="checkbox" />
          <span>{{ t('settings.appSettings.pdfParser.enableTable') }}</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="cloudConfig.is_ocr" type="checkbox" />
          <span>{{ t('settings.appSettings.pdfParser.isOcr') }}</span>
        </label>
      </div>
    </template>
  </SettingsCard>
</template>
