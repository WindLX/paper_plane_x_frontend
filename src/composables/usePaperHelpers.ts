import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { api } from '@/api'
import type { PaperDetailResponse } from '@/types/api'
import { isPlainObject } from '@/utils/renderValueInline'

export type Dict = Record<string, unknown>

export type Citation = { quote: string; sourceHeader: string }

export type CitedBlock = { text: string; citations: Citation[] }

export type EvidenceField = { label: string; text: string; citations: Citation[] }

export type SectionCard = { title: string; fields: EvidenceField[] }

export function asDict(value: unknown): Dict | null {
  return isPlainObject(value) ? (value as Dict) : null
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export function asMarkdown(value: unknown): string {
  if (value == null) return '-'
  if (typeof value === 'string') return value.trim() || '-'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value, null, 2)
}

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
}

export function asCitationList(value: unknown): Citation[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const row = asDict(item)
      if (!row) return null
      const quote = asString(row.quote) ?? ''
      const sourceHeader = asString(row.source_header) ?? ''
      if (!quote && !sourceHeader) return null
      return { quote, sourceHeader }
    })
    .filter((item): item is Citation => item !== null)
}

export function asCitedBlock(value: unknown): CitedBlock | null {
  const row = asDict(value)
  if (!row) return null
  const text = asString(row.text) ?? ''
  const citations = asCitationList(row.citations)
  if (!text && citations.length === 0) return null
  return { text, citations }
}

export function pickFirstString(row: Dict, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(row[key])
    if (value) return value
  }
  return null
}

export function labelize(key: string): string {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (s) => s.toUpperCase())
}

export function normalizeEvidenceField(key: string, value: unknown): EvidenceField | null {
  const cited = asCitedBlock(value)
  if (cited) {
    return {
      label: labelize(key),
      text: cited.text || '-',
      citations: cited.citations,
    }
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return {
      label: labelize(key),
      text: asMarkdown(value),
      citations: [],
    }
  }

  if (Array.isArray(value)) {
    const primitiveValues = value
      .map((item) =>
        typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
          ? String(item)
          : null,
      )
      .filter((item): item is string => Boolean(item && item.trim().length > 0))
    if (primitiveValues.length) {
      return {
        label: labelize(key),
        text: `- ${primitiveValues.join('\n- ')}`,
        citations: [],
      }
    }
  }

  const row = asDict(value)
  if (!row) return null

  const directText = pickFirstString(row, ['text', 'summary', 'description', 'detail', 'value'])
  if (directText) {
    return {
      label: labelize(key),
      text: directText,
      citations: asCitationList(row.citations),
    }
  }

  const nestedLines = Object.entries(row)
    .filter(([nestedKey, nestedValue]) => nestedKey !== 'citations' && nestedValue != null)
    .map(([nestedKey, nestedValue]) => `**${labelize(nestedKey)}**: ${asMarkdown(nestedValue)}`)
  if (!nestedLines.length) return null

  return {
    label: labelize(key),
    text: nestedLines.join('\n\n'),
    citations: asCitationList(row.citations),
  }
}

export function asSectionCards(
  value: unknown,
  fallbackTitle = 'Item',
  summaryLabel = 'Summary',
): SectionCard[] {
  if (value == null) return []
  const source = Array.isArray(value) ? value : [value]
  return source
    .map((item, index) => {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
        return {
          title: `${fallbackTitle} ${index + 1}`,
          fields: [{ label: summaryLabel, text: asMarkdown(item), citations: [] }],
        }
      }

      const row = asDict(item)
      if (!row) return null

      const title =
        pickFirstString(row, ['approach_name', 'name', 'title', 'topic', 'area', 'label', 'id']) ??
        `${fallbackTitle} ${index + 1}`
      const fields = Object.entries(row)
        .filter(
          ([key]) =>
            ![
              'approach_name',
              'name',
              'title',
              'topic',
              'area',
              'label',
              'id',
              'citations',
            ].includes(key),
        )
        .map(([key, raw]) => normalizeEvidenceField(key, raw))
        .filter((field): field is EvidenceField => field !== null)

      if (!fields.length) {
        fields.push({
          label: summaryLabel,
          text: asMarkdown(item),
          citations: [],
        })
      }
      return { title, fields }
    })
    .filter((item): item is SectionCard => item !== null)
}

export function usePaperHelpers(paper: PaperDetailResponse | null) {
  const { t } = useI18n()

  const hasQuickScan = computed(() => isPlainObject(paper?.quick_scan))
  const hasSynthesis = computed(() => isPlainObject(paper?.synthesis_data))
  const hasAnalysisReport = computed(() => isPlainObject(paper?.analysis_report))
  const hasExtractionFactCheck = computed(() => isPlainObject(paper?.extraction_fact_check_result))
  const hasAnalysisFactCheck = computed(() => isPlainObject(paper?.analysis_fact_check_result))

  const quickScan = computed(() => asDict(paper?.quick_scan))
  const synthesis = computed(() => asDict(paper?.synthesis_data))
  const analysis = computed(() => asDict(paper?.analysis_report))
  const extractionFactCheck = computed(() => asDict(paper?.extraction_fact_check_result))
  const analysisFactCheck = computed(() => asDict(paper?.analysis_fact_check_result))

  const quickScanTags = computed(() => asStringList(quickScan.value?.tags))
  const quickScanVerdict = computed(() => asString(quickScan.value?.verdict))
  const quickScanReason = computed(() => asString(quickScan.value?.reason))
  const quickScanSummary = computed(() => asString(quickScan.value?.quick_summary))

  const synthesisSummary = computed(() => {
    const value = synthesis.value
    if (!value) return null
    return asCitedBlock(value.review_summary ?? value.summary ?? value.review)
  })

  const synthesisMethodology = computed(() => {
    const value = synthesis.value
    if (!value) return []
    return asSectionCards(
      value.methodology ?? value.methods ?? value.method,
      t('paper.generic.method'),
      t('paper.generic.summary'),
    )
  })

  const synthesisKeyResults = computed(() => {
    const value = synthesis.value
    if (!value) return []
    return asSectionCards(
      value.key_results ?? value.results ?? value.findings,
      t('paper.generic.result'),
      t('paper.generic.summary'),
    )
  })

  const synthesisGaps = computed(() => {
    const value = synthesis.value
    if (!value) return []
    return asSectionCards(
      value.research_gaps ??
        value.research_gap ??
        value.gaps ??
        value.future_work ??
        value.limitations,
      t('paper.generic.gap'),
      t('paper.generic.summary'),
    )
  })

  const analysisPrerequisites = computed(() => {
    if (!Array.isArray(analysis.value?.prerequisites)) return []
    return analysis.value.prerequisites
      .map((item) => {
        const row = asDict(item)
        if (!row) return null
        return {
          conceptName: asString(row.concept_name) ?? '-',
          briefExplanation: asMarkdown(row.brief_explanation),
          relevance: asCitedBlock(row.relevance_to_paper),
        }
      })
      .filter(
        (
          item,
        ): item is {
          conceptName: string
          briefExplanation: string
          relevance: CitedBlock | null
        } => item !== null,
      )
  })

  const analysisCoreFormulation = computed(() => {
    const row = asDict(analysis.value?.core_formulation)
    return {
      problemDefinition: asCitedBlock(row?.problem_definition),
      objectiveFunction: asCitedBlock(row?.objective_function),
      algorithmFlow: asCitedBlock(row?.algorithm_flow),
    }
  })

  const analysisDerivationSteps = computed(() => {
    if (!Array.isArray(analysis.value?.derivation_steps)) return []
    return analysis.value.derivation_steps
      .map((item) => {
        const row = asDict(item)
        if (!row) return null
        return {
          stepOrder: typeof row.step_order === 'number' ? row.step_order : null,
          stepName: asString(row.step_name) ?? '-',
          detail: asCitedBlock(row.detail_explanation),
        }
      })
      .filter(
        (item): item is { stepOrder: number | null; stepName: string; detail: CitedBlock | null } =>
          item !== null,
      )
  })

  const analysisRelatedReferences = computed(() => {
    if (!Array.isArray(analysis.value?.related_references)) return []
    return analysis.value.related_references
      .map((item) => {
        const row = asDict(item)
        if (!row) return null
        return {
          title: asMarkdown(row.title),
          reason: asMarkdown(row.reason),
        }
      })
      .filter((item): item is { title: string; reason: string } => item !== null)
  })

  const analysisExtras = computed(() => {
    if (!analysis.value) return []
    const reserved = new Set([
      'prerequisites',
      'core_formulation',
      'derivation_steps',
      'related_references',
    ])
    return Object.entries(analysis.value)
      .filter(([key, value]) => !reserved.has(key) && value != null)
      .map(([key, value]) => ({
        key,
        label: labelize(key),
        value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      }))
  })

  const extractionFactCheckPassed = computed(() => {
    const value = extractionFactCheck.value?.is_passed
    return typeof value === 'boolean' ? value : null
  })

  const extractionFactCheckErrors = computed(() => {
    const singleError = asString(extractionFactCheck.value?.error)
    if (singleError) return [singleError]

    const errors = extractionFactCheck.value?.errors
    if (!Array.isArray(errors)) return []
    return errors.map((item) => asDict(item)).filter((item): item is Dict => item !== null)
  })

  const analysisFactCheckPassed = computed(() => {
    const value = analysisFactCheck.value?.is_passed
    return typeof value === 'boolean' ? value : null
  })

  const analysisFactCheckErrors = computed(() => {
    const singleError = asString(analysisFactCheck.value?.error)
    if (singleError) return [singleError]

    const errors = analysisFactCheck.value?.errors
    if (!Array.isArray(errors)) return []
    return errors.map((item) => asDict(item)).filter((item): item is Dict => item !== null)
  })

  return {
    hasQuickScan,
    hasSynthesis,
    hasAnalysisReport,
    hasExtractionFactCheck,
    hasAnalysisFactCheck,
    quickScan,
    synthesis,
    analysis,
    extractionFactCheck,
    analysisFactCheck,
    quickScanTags,
    quickScanVerdict,
    quickScanReason,
    quickScanSummary,
    synthesisSummary,
    synthesisMethodology,
    synthesisKeyResults,
    synthesisGaps,
    analysisPrerequisites,
    analysisCoreFormulation,
    analysisDerivationSteps,
    analysisRelatedReferences,
    analysisExtras,
    extractionFactCheckPassed,
    extractionFactCheckErrors,
    analysisFactCheckPassed,
    analysisFactCheckErrors,
  }
}

export function useProjectLinkModal(paper: PaperDetailResponse | null) {
  const projectLinkModalOpen = ref(false)
  const projectKeyword = ref('')
  const availableProjects = ref<
    Array<{ project_id: string; name: string; description: string | null }>
  >([])
  const projectSearchLoading = ref(false)

  const linkedProjectIds = computed(() => new Set(paper?.project_ids ?? []))

  const filteredProjects = computed(() => {
    const keyword = projectKeyword.value.trim().toLowerCase()
    const excluded = new Set(linkedProjectIds.value)
    const projects = availableProjects.value.filter((project) => !excluded.has(project.project_id))
    if (!keyword) return projects
    return projects.filter((project) =>
      [project.name, project.description ?? '', project.project_id].some((field) =>
        field.toLowerCase().includes(keyword),
      ),
    )
  })

  function isPaperLinkedToProject(projectId: string): boolean {
    return linkedProjectIds.value.has(projectId)
  }

  async function openProjectLinkModal(): Promise<void> {
    projectLinkModalOpen.value = true
    projectKeyword.value = ''
    if (projectSearchLoading.value) return

    projectSearchLoading.value = true
    try {
      const payload = await api.listProjects(0, 100, 'desc', 'updated_at')
      availableProjects.value = payload.items.map((project) => ({
        project_id: project.project_id,
        name: project.name,
        description: project.description,
      }))
    } catch {
      availableProjects.value = []
    } finally {
      projectSearchLoading.value = false
    }
  }

  return {
    projectLinkModalOpen,
    projectKeyword,
    availableProjects,
    projectSearchLoading,
    filteredProjects,
    isPaperLinkedToProject,
    openProjectLinkModal,
  }
}
