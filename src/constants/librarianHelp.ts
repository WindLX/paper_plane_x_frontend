import { ref } from 'vue'

import { api } from '../api/client'
import type { LibrarianGuideResponse } from '../types/api'

export type LibrarianHelpContent = {
  fieldPathsGuide: string
  globalFinderSchema: Record<string, unknown>
  querySchema: Record<string, unknown>
  projectionSchema: Record<string, unknown>
  matrixSchema: Record<string, unknown>
  queryExamples: string[]
  projectionExamples: string[]
  matrixTips: string[]
  projectQueryTips: string[]
  globalFinderTips: string[]
}

function normalizeGuide(guide: LibrarianGuideResponse): LibrarianHelpContent {
  return {
    fieldPathsGuide: guide.field_paths_guide,
    globalFinderSchema: guide.global_finder_schema,
    querySchema: guide.query_schema,
    projectionSchema: guide.projection_schema,
    matrixSchema: guide.matrix_schema,
    queryExamples: guide.query_examples,
    projectionExamples: guide.projection_examples,
    matrixTips: guide.matrix_tips,
    projectQueryTips: guide.project_query_tips,
    globalFinderTips: guide.global_finder_tips,
  }
}

export const EMPTY_LIBRARIAN_GUIDE: LibrarianHelpContent = normalizeGuide({
  field_paths_guide: '',
  global_finder_schema: {},
  query_schema: {},
  projection_schema: {},
  matrix_schema: {},
  query_examples: [],
  projection_examples: [],
  matrix_tips: [],
  project_query_tips: [],
  global_finder_tips: [],
})

const guideRef = ref<LibrarianHelpContent>(EMPTY_LIBRARIAN_GUIDE)
let guidePromise: Promise<LibrarianHelpContent> | null = null

export function useLibrarianGuide() {
  async function ensureGuide(): Promise<LibrarianHelpContent> {
    if (guideRef.value.queryExamples.length > 0) {
      return guideRef.value
    }

    if (!guidePromise) {
      guidePromise = api
        .getLibrarianGuide()
        .then((guide) => {
          const normalized = normalizeGuide(guide)
          guideRef.value = normalized
          return normalized
        })
        .finally(() => {
          guidePromise = null
        })
    }

    return guidePromise
  }

  return {
    guide: guideRef,
    ensureGuide,
  }
}
