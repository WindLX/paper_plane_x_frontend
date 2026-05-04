<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AgentConfigsSection from '@/components/settings/AgentConfigsSection.vue'
import AgentModal from '@/components/settings/AgentModal.vue'
import AppearanceCard from '@/components/settings/AppearanceCard.vue'
import AppSettingsSection from '@/components/settings/AppSettingsSection.vue'
import LanguageCard from '@/components/settings/LanguageCard.vue'
import ProviderModal from '@/components/settings/ProviderModal.vue'
import ProvidersSection from '@/components/settings/ProvidersSection.vue'
import { useDialog } from '@/composables/useDialog'
import { useSettingsStore } from '@/stores/settings'
import type { AgentLLMConfig, LLMProvider } from '@/types/api'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const dialog = useDialog()

/* ── Provider Modal ───────────────────────────────────────────── */
const showProviderModal = ref(false)
const editingProvider = ref<LLMProvider | null>(null)

function openAddProvider() {
  editingProvider.value = null
  showProviderModal.value = true
}

function openEditProvider(p: LLMProvider) {
  editingProvider.value = p
  showProviderModal.value = true
}

async function onSaveProvider(payload: LLMProvider) {
  if (editingProvider.value) {
    const oldName = editingProvider.value.name
    const { name: newName, ...rest } = payload
    if (newName !== oldName) {
      await settingsStore.renameProvider(oldName, newName)
    }
    // 无论是否重命名，都更新其他字段
    await settingsStore.updateProvider(newName, rest)
  } else {
    await settingsStore.createProvider(payload)
  }
  showProviderModal.value = false
}

async function onDeleteProvider(p: LLMProvider) {
  const ok = await dialog.confirm({
    title: t('dialog.confirm'),
    message: t('settings.providers.deleteConfirm', { name: p.name }),
    tone: 'danger',
  })
  if (ok) {
    await settingsStore.removeProvider(p.name)
  }
}

/* ── Agent Modal ──────────────────────────────────────────────── */
const showAgentModal = ref(false)
const editingAgent = ref<AgentLLMConfig | null>(null)

function openEditAgent(agent: AgentLLMConfig) {
  editingAgent.value = agent
  showAgentModal.value = true
}

async function onSaveAgent(
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
  await settingsStore.updateAgentConfig(agentName, payload)
  showAgentModal.value = false
}

/* ── Lifecycle ────────────────────────────────────────────────── */
onMounted(() => {
  settingsStore.fetchProviders()
  settingsStore.fetchAgentConfigs()
  settingsStore.fetchAppSettings()
})
</script>

<template>
  <section class="animate-fade-in-up space-y-5">
    <!-- Appearance & Language -->
    <section class="grid gap-4 xl:grid-cols-2">
      <AppearanceCard />
      <LanguageCard />
    </section>

    <!-- Providers & MinerU -->
    <ProvidersSection
      :providers="settingsStore.providers"
      :loading="settingsStore.loadingProviders"
      @add="openAddProvider"
      @edit="openEditProvider"
      @delete="onDeleteProvider"
    />

    <!-- Agent Configs -->
    <AgentConfigsSection :agents="settingsStore.agentConfigs" @edit="openEditAgent" />

    <!-- App Settings -->
    <AppSettingsSection />

    <!-- Provider Modal -->
    <ProviderModal
      :open="showProviderModal"
      :editing-provider="editingProvider"
      @close="showProviderModal = false"
      @save="onSaveProvider"
    />

    <!-- Agent Modal -->
    <AgentModal
      :open="showAgentModal"
      :editing-agent="editingAgent"
      :providers="settingsStore.providers"
      @close="showAgentModal = false"
      @save="onSaveAgent"
    />
  </section>
</template>
