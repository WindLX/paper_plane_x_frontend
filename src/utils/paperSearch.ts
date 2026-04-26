import type { LibrarianMatrixResponse, PaperResponse } from '../types/api'

export function matrixResultToPapers(
  matrixResult: LibrarianMatrixResponse,
  fallbackProjectId?: string,
): PaperResponse[] {
  return matrixResult.paper_ids.map((paperId) => {
    const row = matrixResult.items[paperId] ?? {}
    const authorsValue = row['meta.authors']
    const projectIdsValue = row['project_ids']
    const imagesPathsValue = row['images_paths']
    return {
      paper_id: paperId,
      project_ids: Array.isArray(projectIdsValue)
        ? projectIdsValue.filter((item): item is string => typeof item === 'string')
        : fallbackProjectId
          ? [fallbackProjectId]
          : [],
      title: typeof row['meta.title'] === 'string' ? row['meta.title'] : null,
      authors: Array.isArray(authorsValue)
        ? authorsValue.filter((item): item is string => typeof item === 'string')
        : [],
      year: typeof row['meta.year'] === 'number' ? row['meta.year'] : null,
      publication:
        typeof row['meta.publication'] === 'string' ? row['meta.publication'] : null,
      doi: typeof row['meta.doi'] === 'string' ? row['meta.doi'] : null,
      custom_meta:
        typeof row['meta.custom_meta'] === 'string'
          ? row['meta.custom_meta']
          : row['meta.custom_meta'] != null
            ? JSON.stringify(row['meta.custom_meta'])
            : null,
      raw_pdf_path:
        typeof row['meta.raw_pdf_path'] === 'string' ? row['meta.raw_pdf_path'] : null,
      raw_pdf_sha256:
        typeof row['meta.raw_pdf_sha256'] === 'string'
          ? row['meta.raw_pdf_sha256']
          : null,
      images_paths: Array.isArray(imagesPathsValue)
        ? imagesPathsValue.filter((item): item is string => typeof item === 'string')
        : [],
      extraction_status:
        typeof row['extraction_status'] === 'string' ? row['extraction_status'] : '-',
      extraction_fact_check_status:
        typeof row['extraction_fact_check_status'] === 'string'
          ? row['extraction_fact_check_status']
          : '-',
      analysis_fact_check_status:
        typeof row['analysis_fact_check_status'] === 'string'
          ? row['analysis_fact_check_status']
          : '-',
      extraction_retry_count:
        typeof row['extraction_retry_count'] === 'number' ? row['extraction_retry_count'] : 0,
      analysis_retry_count:
        typeof row['analysis_retry_count'] === 'number' ? row['analysis_retry_count'] : 0,
      created_at: typeof row['created_at'] === 'string' ? row['created_at'] : '',
      updated_at: typeof row['updated_at'] === 'string' ? row['updated_at'] : '',
    }
  })
}
