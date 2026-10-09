import { useI18n } from 'vue-i18n'

import type { ProjectActivity } from '@/types/api'
import {
  activityEventKey,
  activityObjectName,
  activityStageKey,
} from '@/utils/activityPresentation'

/** Localizes activity event codes and attention stages for display. */
export function useActivityPresentation() {
  const { t } = useI18n()

  function eventLabel(activity: ProjectActivity): string {
    const key = activityEventKey(activity.event_type)
    if (!key) return activity.event_type
    return t(key, { name: activityObjectName(activity) }).trim()
  }

  function stageLabel(stage: string | null | undefined): string {
    if (!stage) return ''
    const key = activityStageKey(stage)
    return key ? t(key) : stage
  }

  return { eventLabel, stageLabel }
}
