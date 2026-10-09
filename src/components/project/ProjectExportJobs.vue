<script setup lang="ts">
import { Download, RefreshCw, X, LoaderCircle } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/AppButton.vue'
import type { ProjectExportJob } from '@/types/api'
import type { BlobTransferProgress } from '@/api/core'
import { formatDateTime } from '@/utils/format'

withDefaults(
  defineProps<{
    jobs: ProjectExportJob[]
    error?: string | null
    downloadingExportId?: string | null
    downloadProgress?: BlobTransferProgress | null
  }>(),
  { error: null, downloadingExportId: null, downloadProgress: null },
)
defineEmits<{
  cancel: [exportId: string]
  download: [exportId: string]
  stopDownload: []
  refresh: []
}>()
const { t } = useI18n()
function packingPercent(job: ProjectExportJob): number | undefined {
  if (job.status === 'completed') return 100
  if (
    !job.total_files ||
    job.phase === 'preparing' ||
    job.phase === 'queued' ||
    job.phase === 'finalizing'
  )
    return undefined
  // File counts measure packing. ZIP finalization has no measurable fraction
  // and uses an indeterminate bar until the archive is ready.
  return Math.round((job.processed_files / job.total_files) * 100)
}
</script>

<template>
  <section class="space-y-3" :aria-label="t('projectExports.title')">
    <div class="flex items-center justify-between gap-2">
      <h4 class="workspace-section-title">{{ t('projectExports.title') }}</h4>
      <AppButton size="xs" variant="outline" @click="$emit('refresh')"
        ><RefreshCw class="h-4 w-4" />{{ t('projectExports.refresh') }}</AppButton
      >
    </div>
    <p class="workspace-body text-xs">{{ t('projectExports.retention') }}</p>
    <p v-if="error" role="alert" class="text-ppx-danger text-sm wrap-anywhere">{{ error }}</p>
    <p v-if="!jobs.length" class="workspace-body">{{ t('projectExports.empty') }}</p>
    <article
      v-for="job in jobs"
      :key="job.export_id"
      class="workspace-panel-inset space-y-2 p-3"
      :data-export-id="job.export_id"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span
          class="workspace-badge"
          :class="
            job.status === 'failed'
              ? 'workspace-badge--danger'
              : job.status === 'completed'
                ? 'workspace-badge--success'
                : 'workspace-badge--neutral'
          "
          >{{ t(`projectExports.status.${job.status}`) }}</span
        >
        <time class="text-ppx-text-soft text-xs">{{ formatDateTime(job.created_at) }}</time>
      </div>
      <template v-if="job.status === 'queued' || job.status === 'running'">
        <div class="text-ppx-text flex items-center gap-2 text-sm">
          <LoaderCircle class="h-4 w-4 animate-spin" />{{ t(`projectExports.phase.${job.phase}`) }}
        </div>
        <progress
          class="workspace-progress"
          :value="packingPercent(job)"
          max="100"
          :aria-label="t(`projectExports.phase.${job.phase}`)"
        />
        <p v-if="job.total_files !== null" class="workspace-body text-xs">
          {{ t('projectExports.progress', { done: job.processed_files, total: job.total_files }) }}
        </p>
        <p v-if="job.current_file" class="workspace-code text-xs wrap-anywhere">
          {{ job.current_file }}
        </p>
        <AppButton
          size="xs"
          variant="outline"
          :disabled="job.cancel_requested"
          @click="$emit('cancel', job.export_id)"
          ><X class="h-4 w-4" />{{
            t(job.cancel_requested ? 'projectExports.stopping' : 'projectExports.cancel')
          }}</AppButton
        >
      </template>
      <p v-if="job.error" role="alert" class="text-ppx-danger text-sm wrap-anywhere">
        {{ job.error }}
      </p>
      <template v-if="job.status === 'completed'">
        <p class="workspace-body text-sm wrap-anywhere">{{ job.download_name }}</p>
        <p v-if="job.expires_at" class="workspace-body text-xs">
          {{ t('projectExports.expires', { time: formatDateTime(job.expires_at) }) }}
        </p>
        <template v-if="downloadingExportId === job.export_id">
          <p class="workspace-body text-sm">{{ t('projectExports.transferring') }}</p>
          <progress
            class="workspace-progress"
            :value="downloadProgress?.total ? downloadProgress.received : undefined"
            :max="downloadProgress?.total ?? 100"
            :aria-label="t('projectExports.transferring')"
          />
          <AppButton size="xs" variant="outline" @click="$emit('stopDownload')"
            ><X class="h-4 w-4" />{{ t('projectExports.stopDownload') }}</AppButton
          >
        </template>
        <AppButton
          v-else
          size="xs"
          variant="solid"
          :disabled="!!downloadingExportId"
          @click="$emit('download', job.export_id)"
          ><Download class="h-4 w-4" />{{ t('projectExports.download') }}</AppButton
        >
      </template>
    </article>
  </section>
</template>
