<script setup lang="ts">
defineProps<{
  /** Table title rendered on the left of the shell header. */
  title?: string
}>()
</script>

<!--
  Shared table shell: header (title + optional right-aligned actions) and the
  horizontal scroll area that holds the `workspace-table` markup. Domain tables
  keep their own columns and forward the `actions` slot here so a page can drop
  bulk controls into the header.
-->
<template>
  <section class="workspace-table-shell">
    <header
      v-if="title || $slots.title || $slots.actions"
      class="border-ppx-border flex h-13 items-center justify-between gap-4 border-b px-4"
    >
      <h3
        class="text-ppx-text max-w-1/2 min-w-0 shrink-0 truncate text-xl font-semibold tracking-tight"
      >
        <slot name="title">{{ title }}</slot>
      </h3>
      <div v-if="$slots.actions" class="flex min-w-0 items-center gap-2 overflow-x-auto py-0.5">
        <slot name="actions" />
      </div>
    </header>
    <div class="overflow-x-auto">
      <slot />
    </div>
  </section>
</template>
