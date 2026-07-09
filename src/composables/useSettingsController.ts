import { reactive, ref } from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type {
  AgentLLMConfig,
  AppSettingsResponse,
  LLMProvider,
  LLMProviderCreateRequest,
  LLMProviderUpdateRequest,
} from '@/types/api'

import { useNotify } from './useNotify'

export type SettingsController = ReturnType<typeof useSettingsController>

export function useSettingsController() {
  const providers = ref<LLMProvider[]>([])
  const agentConfigs = ref<AgentLLMConfig[]>([])
  const appSettings = ref<AppSettingsResponse | null>(null)

  const loadingProviders = ref(false)
  const loadingAgents = ref(false)
  const loadingAppSettings = ref(false)

  const saving = ref(false)
  const error = ref<string | null>(null)
  const notify = useNotify()

  function notifySuccess(key: string) {
    notify.push(translate(key), 'success', 2000)
  }

  async function fetchProviders() {
    loadingProviders.value = true
    error.value = null
    try {
      const res = await api.listProviders()
      providers.value = res.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('settings.errors.loadProviders')
      notify.push(error.value, 'error', 3600)
    } finally {
      loadingProviders.value = false
    }
  }

  async function createProvider(payload: LLMProviderCreateRequest) {
    saving.value = true
    error.value = null
    try {
      await api.createProvider(payload)
      await fetchProviders()
      notifySuccess('settings.success.createProvider')
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('settings.errors.createProvider')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function updateProvider(name: string, payload: LLMProviderUpdateRequest) {
    saving.value = true
    error.value = null
    try {
      await api.updateProvider(name, payload)
      await fetchProviders()
      notifySuccess('settings.success.updateProvider')
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('settings.errors.updateProvider')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function renameProvider(oldName: string, newName: string) {
    saving.value = true
    error.value = null
    try {
      await api.renameProvider(oldName, { name: newName })
      await fetchProviders()
      await fetchAgentConfigs()
      notifySuccess('settings.success.renameProvider')
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('settings.errors.renameProvider')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function removeProvider(name: string) {
    saving.value = true
    error.value = null
    try {
      await api.deleteProvider(name)
      await fetchProviders()
      notifySuccess('settings.success.removeProvider')
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('settings.errors.removeProvider')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function fetchAgentConfigs() {
    loadingAgents.value = true
    error.value = null
    try {
      const res = await api.listAgentConfigs()
      agentConfigs.value = res.items
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.loadAgentConfigs')
      notify.push(error.value, 'error', 3600)
    } finally {
      loadingAgents.value = false
    }
  }

  async function updateAgentConfig(
    agentName: string,
    payload: {
      provider_name: string
      temperature?: number | null
      max_tokens?: number | null
      timeout?: number | null
      thinking_enabled?: boolean | null
      reasoning_effort?: string | null
      extra_body?: Record<string, unknown> | null
      is_vlm?: boolean | null
      short_memory_window?: number | null
    },
  ) {
    saving.value = true
    error.value = null
    try {
      await api.updateAgentConfig(agentName, payload)
      await fetchAgentConfigs()
      notifySuccess('settings.success.updateAgentConfig')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updateAgentConfig')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function fetchAppSettings() {
    loadingAppSettings.value = true
    error.value = null
    try {
      const res = await api.getAppSettings()
      appSettings.value = res
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.loadAppSettings')
      notify.push(error.value, 'error', 3600)
    } finally {
      loadingAppSettings.value = false
    }
  }

  async function updatePdfParserLocalConfig(
    payload: Partial<AppSettingsResponse['pdf_parser']['local']>,
  ) {
    saving.value = true
    error.value = null
    try {
      await api.updateLocalPdfParserConfig(payload)
      await fetchAppSettings()
      notifySuccess('settings.success.updatePdfParserConfig')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updatePdfParserConfig')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function updatePdfParserCloudConfig(
    payload: Partial<AppSettingsResponse['pdf_parser']['cloud']> & { api_key?: string | null },
  ) {
    saving.value = true
    error.value = null
    try {
      await api.updateCloudPdfParserConfig(payload)
      await fetchAppSettings()
      notifySuccess('settings.success.updatePdfParserConfig')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updatePdfParserConfig')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function updateDataProcessConfig(payload: Partial<AppSettingsResponse['data_process']>) {
    saving.value = true
    error.value = null
    try {
      await api.updateDataProcessConfig(payload)
      await fetchAppSettings()
      notifySuccess('settings.success.updateDataProcessConfig')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updateDataProcessConfig')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function updateLibrarianConfig(payload: Partial<AppSettingsResponse['librarian']>) {
    saving.value = true
    error.value = null
    try {
      await api.updateLibrarianConfig(payload)
      await fetchAppSettings()
      notifySuccess('settings.success.updateLibrarianConfig')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updateLibrarianConfig')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function updatePandocConfig(payload: Partial<AppSettingsResponse['pandoc']>) {
    saving.value = true
    error.value = null
    try {
      await api.updatePandocConfig(payload)
      await fetchAppSettings()
      notifySuccess('settings.success.updatePandocConfig')
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updatePandocConfig')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  return reactive({
    providers,
    agentConfigs,
    appSettings,
    loadingProviders,
    loadingAgents,
    loadingAppSettings,
    saving,
    error,
    fetchProviders,
    createProvider,
    updateProvider,
    renameProvider,
    removeProvider,
    fetchAgentConfigs,
    updateAgentConfig,
    fetchAppSettings,
    updatePdfParserLocalConfig,
    updatePdfParserCloudConfig,
    updateDataProcessConfig,
    updateLibrarianConfig,
    updatePandocConfig,
  })
}
