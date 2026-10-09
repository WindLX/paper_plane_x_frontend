<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  TriangleAlert,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppButton from '@/components/AppButton.vue'
import JsonPanel from '@/components/JsonPanel.vue'
import { useActivityPresentation } from '@/composables/useActivityPresentation'
import type { ProjectActivity } from '@/types/api'
import {
  ACTIVITY_CATEGORY_ICONS,
  ACTIVITY_STATUS_ICONS,
  ACTIVITY_STATUS_CLASSES,
} from '@/utils/activityAppearance'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  activity: ProjectActivity
  defaultExpanded?: boolean
}>()

const emit = defineEmits<{
  openTask: [taskId: string]
  openTrace: [traceId: string]
  openPaper: [paperId: string]
  openFile: [filePath: string]
}>()

const { t } = useI18n()
const { eventLabel } = useActivityPresentation()
const expanded = ref(props.defaultExpanded ?? false)
watch(
  () => props.defaultExpanded,
  (value) => {
    if (value) expanded.value = true
  },
)

const categoryIcon = computed(() => ACTIVITY_CATEGORY_ICONS[props.activity.category])
const statusIcon = computed(() => ACTIVITY_STATUS_ICONS[props.activity.status])
const statusClass = computed(() => ACTIVITY_STATUS_CLASSES[props.activity.status])
const categoryLabel = computed(() => t(`workbench.activity.categories.${props.activity.category}`))
const statusLabel = computed(() => t(`workbench.activity.statuses.${props.activity.status}`))
const startedAt = computed(() => props.activity.started_at ?? props.activity.created_at)
const detailKeys = computed(() => Object.keys(props.activity.detail ?? {}))
</script>

<template>
  <tr
    class="workspace-row-hover"
    :class="{ 'workspace-row-selected': expanded }"
    :data-activity-id="activity.activity_id"
  >
    <td class="w-28 !align-middle whitespace-nowrap">
      <span
        class="workspace-badge workspace-badge--neutral inline-flex items-center gap-1.5 text-xs"
      >
        <component :is="categoryIcon" class="h-3.5 w-3.5" aria-hidden="true" />{{ categoryLabel }}
      </span>
    </td>
    <td class="min-w-64 !align-middle">
      <div class="flex items-start gap-2">
        <button
          type="button"
          class="workspace-icon-button !h-7 !w-7 shrink-0"
          :aria-label="expanded ? t('workbench.activity.collapse') : t('workbench.activity.expand')"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          <ChevronDown v-if="expanded" class="h-3.5 w-3.5" /><ChevronRight
            v-else
            class="h-3.5 w-3.5"
          />
        </button>
        <span class="text-ppx-text pt-1 text-sm wrap-anywhere">{{ eventLabel(activity) }}</span>
      </div>
    </td>
    <td class="w-28 !align-middle whitespace-nowrap">
      <span class="workspace-badge inline-flex items-center gap-1.5 text-xs" :class="statusClass"
        ><component :is="statusIcon" class="h-3.5 w-3.5" aria-hidden="true" />{{
          statusLabel
        }}</span
      >
    </td>
    <td class="!align-middle whitespace-nowrap">
      <time class="text-ppx-text-muted text-xs" :datetime="startedAt">{{
        formatDateTime(startedAt)
      }}</time>
    </td>
    <td class="!align-middle">
      <div class="flex items-center justify-end gap-1.5 whitespace-nowrap">
        <AppButton
          v-if="activity.paper_id"
          size="xs"
          variant="outline"
          @click="emit('openPaper', activity.paper_id)"
        >
          <ExternalLink class="h-3 w-3" />
          <span>{{ t('workbench.activity.openPaper') }}</span>
        </AppButton>
        <AppButton
          v-if="activity.file_path"
          size="xs"
          variant="outline"
          @click="emit('openFile', activity.file_path)"
        >
          <FileText class="h-3 w-3" />
          <span>{{ t('workbench.activity.openFile') }}</span>
        </AppButton>
        <AppButton
          v-if="activity.task_id && activity.task_exists"
          size="xs"
          variant="outline"
          @click="emit('openTask', activity.task_id)"
        >
          <ExternalLink class="h-3 w-3" />
          <span>{{ t('workbench.activity.openTask') }}</span>
        </AppButton>
        <span
          v-else-if="activity.task_id && !activity.task_exists"
          class="text-ppx-text-muted inline-flex items-center gap-1 text-xs"
        >
          <TriangleAlert class="h-3 w-3" />
          {{ t('workbench.activity.missingTask') }}
        </span>
      </div>
    </td>
  </tr>
  <tr v-if="expanded" class="bg-ppx-bg-subtle/50" data-activity-detail>
    <td colspan="5">
      <div class="space-y-3 p-3">
        <div class="text-ppx-text-soft flex flex-wrap items-center gap-1.5 text-xs">
          <span class="workspace-label mb-0">{{ t('workbench.activity.eventCode') }}</span>
          <code class="workspace-code break-all">{{ activity.event_type }}</code>
        </div>

        <div class="workspace-panel-inset space-y-1 rounded-xl p-2.5">
          <div class="workspace-label mb-0">{{ t('workbench.activity.taskTimes') }}</div>
          <div class="text-ppx-text-soft grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            <div>
              <span class="text-ppx-text font-medium"
                >{{ t('workbench.activity.startedAt') }}:</span
              >
              {{ formatDateTime(activity.started_at) }}
            </div>
            <div>
              <span class="text-ppx-text font-medium"
                >{{ t('workbench.activity.finishedAt') }}:</span
              >
              {{ formatDateTime(activity.finished_at) }}
            </div>
          </div>
        </div>

        <div v-if="activity.error" class="bg-ppx-danger-soft rounded-xl p-2.5 text-xs" role="alert">
          <div class="text-ppx-danger flex items-center gap-1 font-medium">
            <TriangleAlert class="h-3 w-3" />
            {{ t('workbench.activity.error') }}
          </div>
          <p class="text-ppx-text mt-1 break-all">{{ activity.error }}</p>
        </div>

        <div v-if="activity.trace_ids.length" class="flex flex-wrap items-center gap-1.5">
          <AppButton
            v-for="traceId in activity.trace_ids"
            :key="traceId"
            size="xs"
            variant="outline"
            @click="emit('openTrace', traceId)"
          >
            <ExternalLink class="h-3 w-3" />
            <span>{{ t('workbench.activity.openTrace') }}</span>
          </AppButton>
        </div>

        <div v-if="activity.file_path" class="text-ppx-text-soft flex items-center gap-1.5 text-xs">
          <ImageIcon v-if="activity.category === 'file'" class="h-3 w-3" />
          <span class="break-all">{{ activity.file_path }}</span>
        </div>

        <JsonPanel
          v-if="detailKeys.length"
          :title="t('workbench.activity.raw')"
          :value="activity.detail"
          :default-open="false"
        />
      </div>
    </td>
  </tr>
</template>
