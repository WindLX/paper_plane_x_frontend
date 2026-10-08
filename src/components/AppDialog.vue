<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'

import AppButton from './AppButton.vue'
import { useDialog } from '@/composables/useDialog'

const dialog = useDialog()
const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

watch(
  () => dialog.state.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      if (dialog.state.open) panel.value?.querySelector<HTMLButtonElement>('button')?.focus()
    } else if (previousFocus?.isConnected) {
      previousFocus.focus()
    }
  },
)

function handleKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') dialog.resolveDialog(false)
  if (event.key !== 'Tab') return
  const buttons = panel.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
  if (!buttons?.length) return
  const target = event.shiftKey ? buttons[buttons.length - 1] : buttons[0]
  const edge = event.shiftKey ? buttons[0] : buttons[buttons.length - 1]
  if (document.activeElement === edge) {
    event.preventDefault()
    target?.focus()
  }
}
</script>

<template>
  <div
    v-if="dialog.state.open"
    class="fixed inset-0 z-80 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
    @click="dialog.resolveDialog(false)"
  >
    <section
      ref="panel"
      class="workspace-page w-full max-w-md p-5"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ppx-dialog-title"
      aria-describedby="ppx-dialog-message"
      @click.stop
      @keydown="handleKey"
    >
      <header class="mb-3 flex items-start gap-2">
        <AlertTriangle
          class="mt-0.5 h-8 w-8"
          :class="dialog.state.tone === 'danger' ? 'text-ppx-danger' : 'text-ppx-info'"
        />
        <div>
          <h3 id="ppx-dialog-title" class="workspace-section-title">
            {{ dialog.state.title }}
          </h3>
          <p id="ppx-dialog-message" class="workspace-body mt-1 whitespace-pre-wrap">
            {{ dialog.state.message }}
          </p>
        </div>
      </header>

      <div class="flex justify-end gap-2">
        <AppButton size="sm" @click="dialog.resolveDialog(false)">
          {{ dialog.state.cancelText }}
        </AppButton>
        <AppButton
          v-if="dialog.state.secondaryText"
          size="sm"
          variant="outline"
          @click="dialog.resolveDialog('secondary')"
        >
          {{ dialog.state.secondaryText }}
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
