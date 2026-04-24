<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { FolderOpen, ListChecks, Moon, Sun } from 'lucide-vue-next'

import AppDialog from './components/AppDialog.vue'
import AppNotify from './components/AppNotify.vue'
import brandIcon from './assets/favicon.svg'

const route = useRoute()
const darkMode = ref(false)

watchEffect(() => {
  const classList = document.documentElement.classList
  if (darkMode.value) {
    classList.add('dark')
  } else {
    classList.remove('dark')
  }
})

const currentRouteTitle = computed(() => {
  const map: Record<string, string> = {
    ProjectsPage: 'Project Management',
    ProjectDetailPage: 'Project Detail',
    TasksPage: 'Task Queue',
    TaskDetailPage: 'Task Detail',
    NotFoundPage: 'Not Found',
  }
  const name = typeof route.name === 'string' ? route.name : ''
  return map[name] ?? 'Control Console'
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
    <header class="sticky top-0 z-20 shadow-md bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div class="flex items-center gap-2">
          <img :src="brandIcon" alt="Paper Plane X" class="h-7 w-7" />
          <div>
            <h1 class="text-lg font-semibold tracking-tight">Paper Plane X Console</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ currentRouteTitle }}</p>
          </div>
        </div>
        <nav class="flex items-center gap-2">
          <RouterLink to="/projects"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800"
            :class="route.path.startsWith('/projects') ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : ''">
            <FolderOpen class="h-4 w-4" />
            <span>Projects</span>
          </RouterLink>
          <RouterLink to="/tasks"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800"
            :class="route.path.startsWith('/tasks') ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : ''">
            <ListChecks class="h-4 w-4" />
            <span>Tasks</span>
          </RouterLink>
          <button type="button"
            class="ml-3 inline-flex items-center gap-1.5 rounded-md border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50 dark:border-slate-600 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800 cursor-pointer"
            @click="darkMode = !darkMode">
            <Sun v-if="darkMode" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
            <span>{{ darkMode ? 'Light' : 'Dark' }}</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-5 py-6">
      <RouterView />
    </main>
    <AppDialog />
    <AppNotify />
  </div>
</template>
