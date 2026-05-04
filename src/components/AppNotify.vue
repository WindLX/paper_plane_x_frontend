<script setup lang="ts">
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-vue-next'

import { useNotify } from '@/composables/useNotify'

const notify = useNotify()
const items = notify.items

function itemClass(type: string): string {
  switch (type) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'error':
      return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    default:
      return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200'
  }
}
</script>

<template>
  <div class="pointer-events-none fixed top-6 right-4 z-50 flex w-[min(420px,95vw)] flex-col gap-2">
    <TransitionGroup name="notify">
      <div
        v-for="item in items"
        :key="item.id"
        class="notify-item shadow-ppx-shadow-raised pointer-events-auto relative overflow-hidden rounded-2xl border p-3.5"
        role="alert"
        aria-live="polite"
        :class="itemClass(item.type)"
      >
        <div class="flex items-start gap-2">
          <Info v-if="item.type === 'info'" class="mt-0.5 h-4 w-4 shrink-0" />
          <CheckCircle2 v-else-if="item.type === 'success'" class="mt-0.5 h-4 w-4 shrink-0" />
          <AlertCircle v-else-if="item.type === 'error'" class="mt-0.5 h-4 w-4 shrink-0" />
          <TriangleAlert v-else class="mt-0.5 h-4 w-4 shrink-0" />
          <p class="grow text-sm">{{ item.message }}</p>
          <button
            type="button"
            aria-label="Close notification"
            class="hover:bg-ppx-border/40 rounded-ppx-interactive p-1 transition"
            @click="notify.remove(item.id)"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          class="notify-progress absolute bottom-0 left-0 h-0.5 w-full bg-current/40"
          :style="{ '--notify-duration': `${item.durationMs}ms` }"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notify-enter-active,
.notify-leave-active {
  transition: all 220ms ease;
}

.notify-enter-from,
.notify-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.notify-move {
  transition: transform 220ms ease;
}

.notify-progress {
  transform-origin: left;
  animation-name: notify-progress-shrink;
  animation-duration: var(--notify-duration);
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes notify-progress-shrink {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}
</style>
