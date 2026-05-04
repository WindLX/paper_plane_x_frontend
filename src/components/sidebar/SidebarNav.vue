<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Activity, LibraryBig, ListChecks, Settings2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  collapsed?: boolean
}>()

const emit = defineEmits<{
  navigate: []
}>()

const route = useRoute()
const { t } = useI18n()

const navItems = computed(() => [
  {
    to: '/library',
    label: t('nav.library'),
    icon: LibraryBig,
    active: route.path.startsWith('/library'),
  },
  {
    to: '/tasks',
    label: t('nav.tasks'),
    icon: ListChecks,
    active: route.path.startsWith('/tasks'),
  },
  {
    to: '/traces',
    label: t('nav.traces'),
    icon: Activity,
    active: route.path.startsWith('/traces'),
  },
  {
    to: '/settings',
    label: t('nav.settings'),
    icon: Settings2,
    active: route.path.startsWith('/settings'),
  },
])
</script>

<template>
  <section class="border-ppx-border mt-3 shrink-0 border-t pt-3">
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="group duration-ppx-fast mb-1 flex h-9 items-center gap-2.5 rounded-xl px-2 text-sm font-medium transition-colors"
      :class="[
        item.active
          ? 'bg-ppx-bg-elevated text-ppx-text shadow-ppx-rest'
          : 'text-ppx-text-soft hover:bg-ppx-bg-elevated/60 hover:text-ppx-text',
        props.collapsed ? 'justify-center' : '',
      ]"
      @click="emit('navigate')"
    >
      <component
        :is="item.icon"
        class="h-4.5 w-4.5"
        :class="item.active ? '' : 'text-ppx-text-soft group-hover:text-current'"
      />
      <span v-if="!props.collapsed">{{ item.label }}</span>
    </RouterLink>
  </section>
</template>
