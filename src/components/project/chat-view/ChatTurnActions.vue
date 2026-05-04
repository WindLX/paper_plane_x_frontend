<script setup lang="ts">
import { GitBranch, Pencil, RotateCcw, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps<{
  visible: boolean
  align?: 'start' | 'end'
}>()

const emit = defineEmits<{
  edit: []
  rerun: []
  delete: []
  fork: []
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="duration-ppx-fast flex items-center gap-1 transition-opacity"
    :class="[
      visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      align === 'start' ? 'justify-start' : 'justify-end',
    ]"
  >
    <button
      type="button"
      class="workspace-icon-button h-8 w-8"
      :title="t('chat.editTurn')"
      @click="emit('edit')"
    >
      <Pencil class="h-4 w-4" />
    </button>
    <button
      type="button"
      class="workspace-icon-button h-8 w-8"
      :title="t('chat.rerunTurn')"
      @click="emit('rerun')"
    >
      <RotateCcw class="h-4 w-4" />
    </button>
    <button
      type="button"
      class="workspace-icon-button h-8 w-8 text-red-500 hover:text-red-600"
      :title="t('chat.deleteTurn')"
      @click="emit('delete')"
    >
      <Trash2 class="h-4 w-4" />
    </button>
    <button
      type="button"
      class="workspace-icon-button h-8 w-8"
      :title="t('chat.forkTurn')"
      @click="emit('fork')"
    >
      <GitBranch class="h-4 w-4" />
    </button>
  </div>
</template>
