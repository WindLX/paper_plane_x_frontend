<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted } from 'vue'

const props = defineProps<{
  src: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="fixed inset-0 z-90 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
    @click.self="emit('close')"
  >
    <button
      type="button"
      class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:bg-black/60"
      @click="emit('close')"
    >
      <X class="h-5 w-5" />
    </button>
    <img
      :src="props.src"
      class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      alt=""
    />
  </div>
</template>
