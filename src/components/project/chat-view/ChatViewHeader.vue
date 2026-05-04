<script setup lang="ts">
import { Pencil, Trash2, PanelRightClose, LoaderCircle, Check, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  isStreaming: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
  stopStream: []
  delete: []
}>()

const title = defineModel<string | null>('title', { default: null })

const { t } = useI18n()

const editing = defineModel<boolean>('editing', { default: false })
const editingValue = defineModel<string>('editingValue', { default: '' })

function startEdit(): void {
  editingValue.value = title.value ?? ''
  editing.value = true
}

function cancelEdit(): void {
  editing.value = false
  editingValue.value = ''
}

function confirmEdit(): void {
  const value = editingValue.value.trim()
  if (value && value !== title.value) {
    title.value = value
  }
  editing.value = false
}

function onDelete(): void {
  emit('delete')
}
</script>

<template>
  <div class="border-ppx-border flex shrink-0 items-center justify-between border-b px-4 py-2.5">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <button
        type="button"
        class="workspace-icon-button lg:hidden"
        :title="t('chat.toggleSidebar')"
        @click="emit('toggleSidebar')"
      >
        <PanelRightClose class="h-4 w-4" />
      </button>
      <template v-if="editing">
        <div class="flex w-full min-w-0 items-center gap-1.5">
          <input
            v-model="editingValue"
            type="text"
            class="workspace-input text-ppx-text min-w-0 flex-1 rounded-md px-2 py-1 text-base font-semibold outline-none"
            @keydown.enter.prevent="confirmEdit"
            @keydown.esc="cancelEdit"
          />
          <div class="flex shrink-0 items-center gap-0.5">
            <button type="button" class="workspace-icon-button h-8 w-8" @click="confirmEdit">
              <Check class="h-4 w-4" />
            </button>
            <button type="button" class="workspace-icon-button h-8 w-8" @click="cancelEdit">
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex min-w-0 items-center gap-2">
          <h2
            class="hover:bg-ppx-bg-elevated/60 text-ppx-text min-w-0 truncate rounded-md px-1.5 py-0.5 text-base font-semibold transition-colors"
          >
            {{ title ?? t('chat.newConversation') }}
          </h2>
          <button
            type="button"
            class="workspace-icon-button h-8 w-8 shrink-0"
            :title="t('chat.rename')"
            @click="startEdit"
          >
            <Pencil class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="workspace-icon-button border-ppx-border-strong text-ppx-danger hover:bg-ppx-danger-soft focus-visible:ring-ppx-danger-soft h-8 w-8 shrink-0 focus-visible:ring-3"
            :title="t('chat.deleteMessage')"
            @click="onDelete"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </template>
    </div>
    <div
      v-if="props.isStreaming"
      class="text-ppx-text-soft flex shrink-0 items-center gap-1.5 text-xs"
    >
      <LoaderCircle class="h-3.5 w-3.5 animate-spin" />
      <span>{{ t('chat.thinking') }}</span>
      <button
        type="button"
        class="text-ppx-text-soft ml-1 rounded-md px-1.5 py-0.5 text-xs"
        @click="emit('stopStream')"
      >
        {{ t('chat.stop') }}
      </button>
    </div>
  </div>
</template>
