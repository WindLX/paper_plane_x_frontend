<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

import AppButton from './AppButton.vue'
import { useDialog } from '../composables/dialog'

const dialog = useDialog()
</script>

<template>
  <div v-if="dialog.state.open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    @click="dialog.resolveDialog(false)">
    <section
      class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      @click.stop>
      <header class="mb-3 flex items-start gap-2">
        <AlertTriangle class="mt-0.5 h-8 w-8"
          :class="dialog.state.tone === 'danger' ? 'text-rose-600 dark:text-rose-300' : 'text-sky-600 dark:text-sky-300'" />
        <div>
          <h3 class="text-m font-semibold text-slate-800 dark:text-slate-200">
            {{ dialog.state.title }}
          </h3>
          <p class="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
            {{ dialog.state.message }}
          </p>
        </div>
      </header>

      <div class="flex justify-end gap-2">
        <AppButton size="sm" @click="dialog.resolveDialog(false)">
          {{ dialog.state.cancelText }}
        </AppButton>
        <AppButton size="sm" :tone="dialog.state.tone === 'danger' ? 'rose' : 'sky'" variant="solid"
          @click="dialog.resolveDialog(true)">
          {{ dialog.state.confirmText }}
        </AppButton>
      </div>
    </section>
  </div>
</template>
