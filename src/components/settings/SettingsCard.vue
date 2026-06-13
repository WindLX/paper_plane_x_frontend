<script setup lang="ts">
import { type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { LoaderCircle } from 'lucide-vue-next'

import AppButton from '@/components/AppButton.vue'

defineProps<{
  title: string
  body?: string
  icon?: Component
  actionLabel?: string
  loading?: boolean
}>()

defineEmits<{
  action: []
}>()

const { t } = useI18n()
</script>

<template>
  <article class="workspace-page relative flex flex-col overflow-hidden p-5">
    <div v-if="loading" class="flex h-full min-h-64 flex-col items-center justify-center gap-3">
      <LoaderCircle class="text-ppx-accent h-10 w-10 animate-spin" />
      <span class="text-ppx-text-muted text-sm font-medium">{{
        t('settings.status.loading')
      }}</span>
    </div>

    <header class="flex items-center gap-2">
      <div v-if="icon" class="workspace-section-icon">
        <component :is="icon" class="text-ppx-text-soft h-4 w-4" />
      </div>
      <h3 class="workspace-section-title">{{ title }}</h3>
      <div v-if="$slots.headerExtra" class="ml-auto">
        <slot name="headerExtra" />
      </div>
    </header>
    <p v-if="body" class="workspace-body mt-1 text-xs">{{ body }}</p>
    <div class="mt-4 flex flex-1 flex-col gap-3">
      <slot />
    </div>
    <div v-if="actionLabel || $slots.footer" class="mt-auto flex justify-end pt-2">
      <slot name="footer">
        <AppButton
          v-if="actionLabel"
          size="sm"
          variant="solid"
          :loading="loading"
          @click="$emit('action')"
        >
          {{ actionLabel }}
        </AppButton>
      </slot>
    </div>
  </article>
</template>
