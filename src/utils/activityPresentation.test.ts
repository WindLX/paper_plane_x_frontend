import { describe, expect, it } from 'vitest'

import { translate } from '@/i18n'
import { activityEventKey, activityObjectName, activityStageKey } from './activityPresentation'

describe('activityPresentation', () => {
  it('maps known backend event codes to i18n keys', () => {
    expect(activityEventKey('task_completed')).toBe('workbench.activity.events.taskCompleted')
    expect(activityEventKey('file_written')).toBe('workbench.activity.events.fileWritten')
    expect(activityEventKey('project_summary_updated')).toBe(
      'workbench.activity.events.projectSummaryUpdated',
    )
  })

  it('maps the librarian global finder alias to the same key', () => {
    expect(activityEventKey('librarian_global_finder_started')).toBe(
      activityEventKey('global_finder_started'),
    )
  })

  it('returns null for unknown codes so callers fall back to the raw code', () => {
    expect(activityEventKey('something_new')).toBeNull()
    expect(activityStageKey('mystery')).toBeNull()
    expect(activityStageKey(null)).toBeNull()
  })

  it('maps attention stages', () => {
    expect(activityStageKey('parse_failed')).toBe('workbench.activity.stages.parsing')
    expect(activityStageKey('task_failed')).toBe('workbench.activity.stages.failed')
    expect(activityStageKey('analysis_fact_check_failed')).toBe(
      'workbench.activity.stages.analysisFactCheck',
    )
    expect(activityStageKey('extraction_fact_check_failed')).toBe(
      'workbench.activity.stages.extractionFactCheck',
    )
    expect(activityStageKey('extraction_fact_check')).toBe(
      'workbench.activity.stages.extractionFactCheck',
    )
  })

  it('prefers the object name, then the file path, then the paper id', () => {
    expect(activityObjectName({ object_name: 'Paper', file_path: '/a', paper_id: 'p' })).toBe(
      'Paper',
    )
    expect(activityObjectName({ object_name: null, file_path: '/a', paper_id: 'p' })).toBe('/a')
    expect(activityObjectName({ object_name: null, file_path: null, paper_id: 'p' })).toBe('p')
    expect(activityObjectName({ object_name: null, file_path: null, paper_id: null })).toBe('')
  })

  it('resolves localized event and stage copy with parameters', () => {
    expect(translate('workbench.activity.events.taskCompleted', { name: 'Notes' })).toBe(
      '任务已完成 Notes',
    )
    expect(translate('workbench.activity.stages.extraction')).toBe('抽取')
  })
})
