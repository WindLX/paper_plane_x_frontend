<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    widthClass?: string
    bottomClass?: string
    showBackdrop?: boolean
  }>(),
  {
    widthClass: 'max-w-5xl',
    bottomClass: 'pb-6',
    showBackdrop: true,
  },
)

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <template v-if="!open">
    <slot />
  </template>

  <Teleport v-else to="body">
    <Transition name="fade">
      <div
        v-if="showBackdrop"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="composer-float" appear>
      <div
        :class="['fixed inset-x-0 bottom-0 z-50 flex justify-center px-4', bottomClass]"
      >
        <div :class="['w-full', widthClass]">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms var(--ppx-ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.composer-float-enter-active,
.composer-float-leave-active {
  transition:
    opacity 220ms var(--ppx-ease-emphasis),
    transform 220ms var(--ppx-ease-emphasis);
}

.composer-float-enter-from,
.composer-float-leave-to {
  opacity: 0;
  transform: translateY(18px) scale(0.985);
}
</style>
