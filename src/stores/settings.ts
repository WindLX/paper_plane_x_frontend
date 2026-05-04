import { defineStore } from 'pinia'
import { ref } from 'vue'

import { api } from '@/api'
import type { AgentLLMConfig, AppSettingsResponse, LLMProvider } from '@/types/api'

export const useSettingsStore = defineStore('settings', () => {
  const providers = ref<LLMProvider[]>([])
  const agentConfigs = ref<AgentLLMConfig[]>([])
  const appSettings = ref<AppSettingsResponse | null>(null)
  const loadingProviders = ref(false)
  const loadingAgents = ref(false)
  const loadingAppSettings = ref(false)
  const saving = ref(false)

  async function fetchProviders() {
    loadingProviders.value = true
    try {
      const res = await api.listProviders()
      providers.value = res.items
    } finally {
      loadingProviders.value = false
    }
  }

  async function createProvider(payload: Omit<LLMProvider, 'name'> & { name: string }) {
    saving.value = true
    try {
      await api.createProvider(payload)
      await fetchProviders()
    } finally {
      saving.value = false
    }
  }

  async function updateProvider(name: string, payload: Partial<Omit<LLMProvider, 'name'>>) {
    saving.value = true
    try {
      await api.updateProvider(name, payload)
      await fetchProviders()
    } finally {
      saving.value = false
    }
  }

  async function renameProvider(oldName: string, newName: string) {
    saving.value = true
    try {
      await api.renameProvider(oldName, { name: newName })
      await fetchProviders()
      await fetchAgentConfigs()
    } finally {
      saving.value = false
    }
  }

  async function removeProvider(name: string) {
    saving.value = true
    try {
      await api.deleteProvider(name)
      await fetchProviders()
    } finally {
      saving.value = false
    }
  }

  async function fetchAgentConfigs() {
    loadingAgents.value = true
    try {
      const res = await api.listAgentConfigs()
      agentConfigs.value = res.items
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
      thinking_enabled?: boolean | null
      reasoning_effort?: string | null
      extra_body?: Record<string, unknown> | null
      is_vlm?: boolean | null
    },
  ) {
    saving.value = true
    try {
      await api.updateAgentConfig(agentName, payload)
      await fetchAgentConfigs()
    } finally {
      saving.value = false
    }
  }

  async function fetchAppSettings() {
    loadingAppSettings.value = true
    try {
      const res = await api.getAppSettings()
      appSettings.value = res
    } finally {
      loadingAppSettings.value = false
    }
  }

  async function updateMinerUConfig(payload: Partial<AppSettingsResponse['mineru']>) {
    saving.value = true
    try {
      await api.updateMinerUConfig(payload)
      await fetchAppSettings()
    } finally {
      saving.value = false
    }
  }

  async function updateDataProcessConfig(payload: Partial<AppSettingsResponse['data_process']>) {
    saving.value = true
    try {
      await api.updateDataProcessConfig(payload)
      await fetchAppSettings()
    } finally {
      saving.value = false
    }
  }

  async function updateLibrarianConfig(payload: Partial<AppSettingsResponse['librarian']>) {
    saving.value = true
    try {
      await api.updateLibrarianConfig(payload)
      await fetchAppSettings()
    } finally {
      saving.value = false
    }
  }

  return {
    providers,
    agentConfigs,
    appSettings,
    loadingProviders,
    loadingAgents,
    loadingAppSettings,
    saving,
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
  }
})
