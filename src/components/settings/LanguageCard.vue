<script setup lang="ts">
import { Globe2, Languages } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import SettingsCard from '@/components/settings/SettingsCard.vue'
import { setAppLocale, type AppLocale } from '@/i18n'

const { t, locale } = useI18n()

function changeLocale(nextLocale: AppLocale): void {
  setAppLocale(nextLocale)
}
</script>

<template>
  <SettingsCard
    :title="t('settings.languageTitle')"
    :body="t('settings.languageBody')"
    :icon="Languages"
  >
    <div class="grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        class="group rounded-ppx-panel duration-ppx-fast relative cursor-pointer overflow-hidden border p-3 text-left transition-all"
        :class="
          locale === 'zh-CN'
            ? 'border-ppx-accent bg-ppx-accent-soft/40 ring-ppx-accent-soft ring-1'
            : 'border-ppx-border bg-ppx-bg-elevated hover:border-ppx-border-strong hover:bg-ppx-bg-subtle'
        "
        @click="changeLocale('zh-CN')"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            :class="
              locale === 'zh-CN'
                ? 'border-ppx-accent/30 bg-ppx-accent-soft'
                : 'border-ppx-border bg-ppx-bg-subtle'
            "
          >
            <Globe2
              class="h-4 w-4"
              :class="locale === 'zh-CN' ? 'text-ppx-accent' : 'text-ppx-text-muted'"
            />
          </div>
          <div>
            <div
              class="text-sm font-semibold"
              :class="locale === 'zh-CN' ? 'text-ppx-accent' : 'text-ppx-text'"
            >
              {{ t('language.zhCN') }}
            </div>
            <div class="workspace-body mt-0.5 text-xs">
              {{ t('settings.languageZhHint') }}
            </div>
          </div>
        </div>
        <div v-if="locale === 'zh-CN'" class="bg-ppx-accent absolute top-0 left-0 h-full w-1" />
      </button>
      <button
        type="button"
        class="group rounded-ppx-panel duration-ppx-fast relative cursor-pointer overflow-hidden border p-3 text-left transition-all"
        :class="
          locale === 'en-US'
            ? 'border-ppx-accent bg-ppx-accent-soft/40 ring-ppx-accent-soft ring-1'
            : 'border-ppx-border bg-ppx-bg-elevated hover:border-ppx-border-strong hover:bg-ppx-bg-subtle'
        "
        @click="changeLocale('en-US')"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            :class="
              locale === 'en-US'
                ? 'border-ppx-accent/30 bg-ppx-accent-soft'
                : 'border-ppx-border bg-ppx-bg-subtle'
            "
          >
            <Globe2
              class="h-4 w-4"
              :class="locale === 'en-US' ? 'text-ppx-accent' : 'text-ppx-text-muted'"
            />
          </div>
          <div>
            <div
              class="text-sm font-semibold"
              :class="locale === 'en-US' ? 'text-ppx-accent' : 'text-ppx-text'"
            >
              {{ t('language.enUS') }}
            </div>
            <div class="workspace-body mt-0.5 text-xs">
              {{ t('settings.languageEnHint') }}
            </div>
          </div>
        </div>
        <div v-if="locale === 'en-US'" class="bg-ppx-accent absolute top-0 left-0 h-full w-1" />
      </button>
    </div>
  </SettingsCard>
</template>
