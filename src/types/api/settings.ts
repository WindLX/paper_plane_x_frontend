export interface LLMProvider {
  name: string
  model: string
  base_url?: string | null
  has_api_key: boolean
}

export interface LLMProviderCreateRequest {
  name: string
  model: string
  api_key?: string | null
  base_url?: string | null
}

export interface LLMProviderUpdateRequest {
  model?: string | null
  api_key?: string | null
  base_url?: string | null
}

export interface LLMProviderRenameRequest {
  name: string
}

export interface AgentLLMConfig {
  agent_name: string
  provider_name: string
  temperature: number
  max_tokens?: number | null
  timeout: number
  thinking_enabled: boolean
  reasoning_effort?: string | null
  extra_body?: Record<string, unknown> | null
  is_vlm: boolean
  short_memory_window: number
  effective_model?: string | null
  effective_base_url?: string | null
}

export interface AgentLLMConfigUpdateRequest {
  provider_name: string
  temperature?: number | null
  max_tokens?: number | null
  timeout?: number | null
  thinking_enabled?: boolean | null
  reasoning_effort?: string | null
  extra_body?: Record<string, unknown> | null
  is_vlm?: boolean | null
  short_memory_window?: number | null
}

export interface ProviderListResponse {
  items: LLMProvider[]
}

export interface AgentConfigListResponse {
  items: AgentLLMConfig[]
}

export type PdfParserType = 'local_mineru' | 'cloud_mineru'

export interface LocalPdfParserConfigResponse {
  base_url: string
  output_dir: string
}

export interface LocalPdfParserConfigUpdateRequest {
  base_url?: string | null
  output_dir?: string | null
}

export interface CloudPdfParserConfigResponse {
  base_url: string
  has_api_key: boolean
  model_version: string
  enable_formula: boolean
  enable_table: boolean
  is_ocr: boolean
  language: string
}

export interface CloudPdfParserConfigUpdateRequest {
  api_key?: string | null
  base_url?: string | null
  model_version?: string | null
  enable_formula?: boolean | null
  enable_table?: boolean | null
  is_ocr?: boolean | null
  language?: string | null
}

export interface PdfParserConfigResponse {
  type: PdfParserType
  local: LocalPdfParserConfigResponse
  cloud: CloudPdfParserConfigResponse
}

export interface DataProcessConfigResponse {
  max_retries: number
  worker_count: number
  shutdown_timeout: number
  task_max_seconds: number
}

export interface DataProcessConfigUpdateRequest {
  max_retries?: number | null
  worker_count?: number | null
  shutdown_timeout?: number | null
  task_max_seconds?: number | null
}

export interface LibrarianConfigResponse {
  top_tags_limit: number
}

export interface LibrarianConfigUpdateRequest {
  top_tags_limit?: number | null
}

export interface PandocConfigResponse {
  pandoc_path?: string | null
  html_template?: string | null
  pdf_engine?: string | null
}

export interface PandocConfigUpdateRequest {
  pandoc_path?: string | null
  html_template?: string | null
  pdf_engine?: string | null
}

export interface AppSettingsResponse {
  agent_llm: AgentLLMConfig[]
  pdf_parser: PdfParserConfigResponse
  data_process: DataProcessConfigResponse
  librarian: LibrarianConfigResponse
  pandoc: PandocConfigResponse
  providers: LLMProvider[]
}
