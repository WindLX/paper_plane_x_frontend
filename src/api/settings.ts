import { request } from './core'
import type {
  AgentConfigListResponse,
  AgentLLMConfig,
  AgentLLMConfigUpdateRequest,
  AppSettingsResponse,
  DataProcessConfigResponse,
  DataProcessConfigUpdateRequest,
  LibrarianConfigResponse,
  LibrarianConfigUpdateRequest,
  LLMProvider,
  LLMProviderCreateRequest,
  LLMProviderRenameRequest,
  LLMProviderUpdateRequest,
  MinerUConfigResponse,
  MinerUConfigUpdateRequest,
  ProviderListResponse,
} from '../types/api'

export const settingsApi = {
  listProviders(): Promise<ProviderListResponse> {
    return request('/settings/providers')
  },

  getProvider(name: string): Promise<LLMProvider> {
    return request(`/settings/providers/${encodeURIComponent(name)}`)
  },

  createProvider(payload: LLMProviderCreateRequest): Promise<LLMProvider> {
    return request('/settings/providers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateProvider(name: string, payload: LLMProviderUpdateRequest): Promise<LLMProvider> {
    return request(`/settings/providers/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  renameProvider(name: string, payload: LLMProviderRenameRequest): Promise<LLMProvider> {
    return request(`/settings/providers/${encodeURIComponent(name)}/rename`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  deleteProvider(name: string): Promise<void> {
    return request(`/settings/providers/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
  },

  listAgentConfigs(): Promise<AgentConfigListResponse> {
    return request('/settings/agent_llm')
  },

  getAgentConfig(agentName: string): Promise<AgentLLMConfig> {
    return request(`/settings/agent_llm/${encodeURIComponent(agentName)}`)
  },

  updateAgentConfig(
    agentName: string,
    payload: AgentLLMConfigUpdateRequest,
  ): Promise<AgentLLMConfig> {
    return request(`/settings/agent_llm/${encodeURIComponent(agentName)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  // App Settings
  getAppSettings(): Promise<AppSettingsResponse> {
    return request('/settings')
  },

  getMinerUConfig(): Promise<MinerUConfigResponse> {
    return request('/settings/mineru')
  },

  updateMinerUConfig(payload: MinerUConfigUpdateRequest): Promise<MinerUConfigResponse> {
    return request('/settings/mineru', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  getDataProcessConfig(): Promise<DataProcessConfigResponse> {
    return request('/settings/data-process')
  },

  updateDataProcessConfig(
    payload: DataProcessConfigUpdateRequest,
  ): Promise<DataProcessConfigResponse> {
    return request('/settings/data-process', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  getLibrarianConfig(): Promise<LibrarianConfigResponse> {
    return request('/settings/librarian')
  },

  updateLibrarianConfig(payload: LibrarianConfigUpdateRequest): Promise<LibrarianConfigResponse> {
    return request('/settings/librarian', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },
}
