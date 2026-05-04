<script setup lang="ts">
import { MoonStar, Monitor, SunMedium } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import SettingsCard from '@/components/settings/SettingsCard.vue'
import { useUiStore } from '@/stores/ui'

const { t } = useI18n()
const uiStore = useUiStore()
</script>

<template>
  <SettingsCard
    :title="t('settings.appearanceTitle')"
    :body="t('settings.appearanceBody')"
    :icon="Monitor"
  >
    <div class="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        class="group rounded-ppx-panel duration-ppx-fast relative cursor-pointer overflow-hidden border p-3 text-left transition-all"
        :class="
          !uiStore.darkMode
            ? 'border-ppx-accent bg-ppx-accent-soft/40 ring-ppx-accent-soft ring-1'
            : 'border-ppx-border bg-ppx-bg-elevated hover:border-ppx-border-strong hover:bg-ppx-bg-subtle'
        "
        @click="uiStore.setDarkMode(false)"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            :class="
              !uiStore.darkMode
                ? 'border-ppx-accent/30 bg-ppx-accent-soft'
                : 'border-ppx-border bg-ppx-bg-subtle'
            "
          >
            <SunMedium
              class="h-4 w-4"
              :class="!uiStore.darkMode ? 'text-ppx-accent' : 'text-ppx-text-muted'"
            />
          </div>
          <div>
            <div
              class="text-sm font-semibold"
              :class="!uiStore.darkMode ? 'text-ppx-accent' : 'text-ppx-text'"
            >
              {{ t('theme.light') }}
            </div>
            <div class="workspace-body mt-0.5 text-xs">
              {{ t('settings.appearanceLightHint') }}
            </div>
          </div>
        </div>
        <div v-if="!uiStore.darkMode" class="bg-ppx-accent absolute top-0 left-0 h-full w-1" />
      </button>
      <button
        type="button"
        class="group rounded-ppx-panel duration-ppx-fast relative cursor-pointer overflow-hidden border p-3 text-left transition-all"
        :class="
          uiStore.darkMode
            ? 'border-ppx-accent bg-ppx-accent-soft/40 ring-ppx-accent-soft ring-1'
            : 'border-ppx-border bg-ppx-bg-elevated hover:border-ppx-border-strong hover:bg-ppx-bg-subtle'
        "
        @click="uiStore.setDarkMode(true)"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            :class="
              uiStore.darkMode
                ? 'border-ppx-accent/30 bg-ppx-accent-soft'
                : 'border-ppx-border bg-ppx-bg-subtle'
            "
          >
            <MoonStar
              class="h-4 w-4"
              :class="uiStore.darkMode ? 'text-ppx-accent' : 'text-ppx-text-muted'"
            />
          </div>
          <div>
            <div
              class="text-sm font-semibold"
              :class="uiStore.darkMode ? 'text-ppx-accent' : 'text-ppx-text'"
            >
              {{ t('theme.dark') }}
            </div>
            <div class="workspace-body mt-0.5 text-xs">
              {{ t('settings.appearanceDarkHint') }}
            </div>
          </div>
        </div>
        <div v-if="uiStore.darkMode" class="bg-ppx-accent absolute top-0 left-0 h-full w-1" />
      </button>
    </div>
  </SettingsCard>
</template>
