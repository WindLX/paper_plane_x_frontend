<script setup lang="ts">
import { GitBranch, LoaderCircle, Pencil, RotateCcw, Trash2 } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    visible: boolean
    align?: 'start' | 'end'
    showEdit?: boolean
    showRerun?: boolean
    showDelete?: boolean
    showFork?: boolean
    forkLoading?: boolean
  }>(),
  {
    align: 'end',
    showEdit: true,
    showRerun: true,
    showDelete: true,
    showFork: true,
    forkLoading: false,
  },
)

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
      props.visible
        ? 'visible pointer-events-auto opacity-100'
        : 'invisible pointer-events-none opacity-0 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100',
      props.align === 'start' ? 'justify-start' : 'justify-end',
    ]"
  >
    <button
      v-if="props.showEdit"
      type="button"
      class="workspace-icon-button h-8 w-8"
      :title="t('projects.chatView.editTurn')"
      @click="emit('edit')"
    >
      <Pencil class="h-4 w-4" />
    </button>
    <button
      v-if="props.showRerun"
      type="button"
      class="workspace-icon-button h-8 w-8"
      :title="t('projects.chatView.rerunTurn')"
      @click="emit('rerun')"
    >
      <RotateCcw class="h-4 w-4" />
    </button>
    <button
      v-if="props.showDelete"
      type="button"
      class="workspace-icon-button h-8 w-8 text-red-500 hover:text-red-600"
      :title="t('projects.chatView.deleteTurn')"
      @click="emit('delete')"
    >
      <Trash2 class="h-4 w-4" />
    </button>
    <button
      v-if="props.showFork"
      type="button"
      class="workspace-icon-button h-8 w-8"
      :title="t('projects.chatView.forkTurn')"
      :disabled="props.forkLoading"
      @click="emit('fork')"
    >
      <LoaderCircle v-if="props.forkLoading" class="h-4 w-4 animate-spin" />
      <GitBranch v-else class="h-4 w-4" />
    </button>
  </div>
</template>
