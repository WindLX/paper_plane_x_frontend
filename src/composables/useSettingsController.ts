import { reactive, ref } from 'vue'

import { api } from '@/api'
import { translate } from '@/i18n'
import type { AgentLLMConfig, AppSettingsResponse, LLMProvider } from '@/types/api'

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

  async function createProvider(payload: Omit<LLMProvider, 'name'> & { name: string }) {
    saving.value = true
    error.value = null
    try {
      await api.createProvider(payload)
      await fetchProviders()
    } catch (err) {
      error.value = err instanceof Error ? err.message : translate('settings.errors.createProvider')
      notify.push(error.value, 'error', 3600)
    } finally {
      saving.value = false
    }
  }

  async function updateProvider(name: string, payload: Partial<Omit<LLMProvider, 'name'>>) {
    saving.value = true
    error.value = null
    try {
      await api.updateProvider(name, payload)
      await fetchProviders()
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

  async function updateMinerUConfig(payload: Partial<AppSettingsResponse['mineru']>) {
    saving.value = true
    error.value = null
    try {
      await api.updateMinerUConfig(payload)
      await fetchAppSettings()
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updateMinerUConfig')
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
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : translate('settings.errors.updateLibrarianConfig')
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
    updateMinerUConfig,
    updateDataProcessConfig,
    updateLibrarianConfig,
  })
}
