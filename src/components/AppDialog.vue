<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

import AppButton from './AppButton.vue'
import { useDialog } from '@/composables/useDialog'

const dialog = useDialog()
</script>

<template>
  <div
    v-if="dialog.state.open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
    @click="dialog.resolveDialog(false)"
  >
    <section
      class="workspace-page w-full max-w-md p-5"
      role="alertdialog"
      aria-modal="true"
      @click.stop
    >
      <header class="mb-3 flex items-start gap-2">
        <AlertTriangle
          class="mt-0.5 h-8 w-8"
          :class="
            dialog.state.tone === 'danger'
              ? 'text-rose-600 dark:text-rose-300'
              : 'text-sky-600 dark:text-sky-300'
          "
        />
        <div>
          <h3 class="workspace-section-title">
            {{ dialog.state.title }}
          </h3>
          <p class="workspace-body mt-1 whitespace-pre-wrap">
            {{ dialog.state.message }}
          </p>
        </div>
      </header>

      <div class="flex justify-end gap-2">
        <AppButton size="sm" @click="dialog.resolveDialog(false)">
          {{ dialog.state.cancelText }}
        </AppButton>
        <AppButton
          size="sm"
          :tone="dialog.state.tone === 'danger' ? 'rose' : 'sky'"
          variant="solid"
          @click="dialog.resolveDialog(true)"
        >
          {{ dialog.state.confirmText }}
        </AppButton>
      </div>
    </section>
  </div>
</template>
