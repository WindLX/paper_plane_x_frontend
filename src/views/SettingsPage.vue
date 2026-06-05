<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import PageLayout from '@/components/layout/PageLayout.vue'
import AppearanceCard from '@/components/settings/AppearanceCard.vue'
import LanguageCard from '@/components/settings/LanguageCard.vue'
import ProvidersSection from '@/components/settings/ProvidersSection.vue'
import ProviderModal from '@/components/settings/ProviderModal.vue'
import AgentConfigsSection from '@/components/settings/AgentConfigsSection.vue'
import AgentModal from '@/components/settings/AgentModal.vue'
import DataProcessCard from '@/components/settings/DataProcessCard.vue'
import LibrarianCard from '@/components/settings/LibrarianCard.vue'
import MinerUCard from '@/components/settings/MinerUCard.vue'

import { useDialog } from '@/composables/useDialog'
import { useSettingsController } from '@/composables/useSettingsController'

import type { AgentLLMConfig, LLMProvider } from '@/types/api'

const { t } = useI18n()
const ctrl = useSettingsController()
const dialog = useDialog()

const isLoading = computed(
  () => ctrl.loadingProviders || ctrl.loadingAgents || ctrl.loadingAppSettings,
)
const isSaving = computed(() => ctrl.saving)
const statusKey = computed(() => (isSaving.value ? 'saving' : 'loading'))

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
      await ctrl.renameProvider(oldName, newName)
    }
    await ctrl.updateProvider(newName, rest)
  } else {
    await ctrl.createProvider(payload)
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
    await ctrl.removeProvider(p.name)
  }
}

/* ── Agent Modal ──────────────────────────────────────────────── */
const showAgentModal = ref(false)
const editingAgent = ref<AgentLLMConfig | null>(null)

function openEditAgent(agent: AgentLLMConfig) {
  editingAgent.value = agent
  showAgentModal.value = true
}

async function onSaveAgent([agentName, payload]: [
  string,
  {
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
]) {
  await ctrl.updateAgentConfig(agentName, payload)
  showAgentModal.value = false
}

/* ── Lifecycle ────────────────────────────────────────────────── */
onMounted(() => {
  ctrl.fetchProviders()
  ctrl.fetchAgentConfigs()
  ctrl.fetchAppSettings()
})
</script>

<template>
  <div class="h-full w-full">
    <PageLayout :title="t('settings.title')" :subtitle="t('settings.subtitle')">
      <section
        class="animate-fade-in-up relative space-y-5 transition-[filter,opacity] duration-300"
        :class="isLoading || isSaving ? 'pointer-events-none opacity-70 blur-[0.5px]' : ''"
        :aria-busy="isLoading || isSaving"
      >
        <div v-if="isLoading || isSaving" class="sticky top-0 z-20 flex justify-end pb-1">
          <div
            class="border-ppx-border bg-ppx-bg-elevated/90 text-ppx-text-soft shadow-ppx-shadow-rest flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm backdrop-blur"
          >
            <span
              class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
            <span>{{ t(`settings.status.${statusKey}`) }}</span>
          </div>
        </div>

        <!-- Appearance & Language -->
        <section class="grid gap-5 xl:grid-cols-2">
          <AppearanceCard />
          <LanguageCard />
        </section>

        <!-- Providers & MinerU -->
        <ProvidersSection
          :providers="ctrl.providers"
          :loading="ctrl.loadingProviders"
          @add="openAddProvider"
          @edit="openEditProvider"
          @delete="onDeleteProvider"
        />

        <!-- Agent Configs -->
        <AgentConfigsSection
          :agents="ctrl.agentConfigs"
          :loading="ctrl.loadingAgents"
          @edit="openEditAgent"
        />

        <!-- App Settings -->
        <section
          v-if="ctrl.loadingAppSettings && !ctrl.appSettings"
          class="grid gap-5 md:grid-cols-2"
        >
          <article class="workspace-page animate-pulse p-5">
            <div class="bg-ppx-bg-subtle h-5 w-32 rounded-full" />
            <div class="rounded-ppx-card bg-ppx-bg-subtle mt-4 h-24" />
          </article>
          <article class="workspace-page animate-pulse p-5">
            <div class="bg-ppx-bg-subtle h-5 w-40 rounded-full" />
            <div class="rounded-ppx-card bg-ppx-bg-subtle mt-4 h-24" />
          </article>
          <article class="workspace-page animate-pulse p-5">
            <div class="bg-ppx-bg-subtle h-5 w-28 rounded-full" />
            <div class="rounded-ppx-card bg-ppx-bg-subtle mt-4 h-24" />
          </article>
        </section>
        <section v-if="ctrl.appSettings" class="grid gap-5 md:grid-cols-2">
          <MinerUCard :ctrl="ctrl" />
          <DataProcessCard :ctrl="ctrl" />
          <LibrarianCard :ctrl="ctrl" />
        </section>

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
          :providers="ctrl.providers"
          @close="showAgentModal = false"
          @save="onSaveAgent"
        />
      </section>
    </PageLayout>
  </div>
</template>
