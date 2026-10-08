<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { nextTick, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const panel = ref<HTMLElement | null>(null)
const titleId = useId()
const descriptionId = useId()
let previousFocus: HTMLElement | null = null

const props = withDefaults(
  defineProps<{
    open?: boolean
    title: string
    description?: string
    widthClass?: string
    zIndex?: string
  }>(),
  {
    open: true,
    description: '',
    widthClass: 'max-w-5xl',
    zIndex: 'z-50',
  },
)

const emit = defineEmits<{
  close: []
}>()

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      if (props.open)
        panel.value?.querySelector<HTMLElement>('button, input, textarea, select')?.focus()
    } else if (previousFocus?.isConnected) {
      previousFocus.focus()
    }
  },
  { immediate: true },
)

function handleKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
  }
  if (event.key !== 'Tab') return
  const controls = Array.from(
    panel.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
    ) ?? [],
  ).filter((element) => element.offsetParent !== null)
  const edge = event.shiftKey ? controls[0] : controls.at(-1)
  if (document.activeElement === edge) {
    event.preventDefault()
    const target = event.shiftKey ? controls.at(-1) : controls[0]
    target?.focus()
  }
}
</script>

<template>
  <teleport to="body">
    <Transition
      enter-active-class="transition-all duration-ppx-standard ease-ppx"
      leave-active-class="transition-all duration-ppx-standard ease-ppx"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.open"
        :class="[
          'fixed inset-0 flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-xs',
          props.zIndex,
        ]"
        @click="emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-ppx-standard ease-ppx-emphasis"
          leave-active-class="transition-all duration-ppx-standard ease-ppx-emphasis"
          enter-from-class="opacity-0 scale-[0.96]"
          leave-to-class="opacity-0 scale-[0.96]"
        >
          <div
            v-if="props.open"
            ref="panel"
            class="modal-surface workspace-page relative flex max-h-[90vh] w-full flex-col overflow-hidden border shadow-[0_24px_64px_-28px_rgba(15,23,42,0.42)]"
            :class="props.widthClass"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="props.description ? descriptionId : undefined"
            @click.stop
            @keydown="handleKey"
          >
            <header
              class="workspace-divider relative flex items-start justify-between gap-4 border-b px-4 py-3"
            >
              <div class="space-y-1">
                <h3 :id="titleId" class="workspace-section-title text-lg leading-6">
                  {{ props.title }}
                </h3>
                <p v-if="props.description" :id="descriptionId" class="workspace-body">
                  {{ props.description }}
                </p>
              </div>
              <button
                type="button"
                :aria-label="t('dialog.cancel')"
                class="workspace-icon-button bg-ppx-bg-elevated/70"
                @click="emit('close')"
              >
                <X class="h-4 w-4" />
              </button>
            </header>
            <div class="min-h-0 flex-1 overflow-auto px-4 py-3.5">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </teleport>
</template>

<style scoped>
.modal-surface {
  border-color: color-mix(in srgb, var(--ppx-border-strong) 88%, transparent);
  background: var(--ppx-bg);
}
</style>
