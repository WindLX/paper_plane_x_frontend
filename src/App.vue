<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { FolderOpen, ListChecks, Moon, Sun } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import AppDialog from './components/AppDialog.vue'
import AppNotify from './components/AppNotify.vue'
import brandIcon from './assets/favicon.svg'
import { appConfig } from './config'
import { setAppLocale, type AppLocale } from './i18n'

const route = useRoute()
const { t, locale } = useI18n()
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
    ProjectsPage: 'routes.projects',
    ProjectDetailPage: 'routes.projectDetail',
    LibrarianPage: 'routes.librarian',
    TasksPage: 'routes.tasks',
    TaskDetailPage: 'routes.taskDetail',
    NotFoundPage: 'routes.notFound',
  }
  const name = typeof route.name === 'string' ? route.name : ''
  return t(map[name] ?? 'routes.console')
})

function changeLocale(nextLocale: AppLocale): void {
  setAppLocale(nextLocale)
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
    <header class="sticky top-0 z-20 shadow-md bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div class="flex items-center gap-2">
          <img :src="brandIcon" :alt="t('common.appName')" class="h-7 w-7" />
          <div>
            <h1 class="text-lg font-semibold tracking-tight">{{ t('common.appName') }}</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ currentRouteTitle }} · v{{ appConfig.appVersion }}
            </p>
          </div>
        </div>
        <nav class="flex items-center gap-2">
          <RouterLink to="/projects"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800"
            :class="route.path.startsWith('/projects') ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : ''">
            <FolderOpen class="h-4 w-4" />
            <span>{{ t('nav.projects') }}</span>
          </RouterLink>
          <RouterLink to="/tasks"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800"
            :class="route.path.startsWith('/tasks') ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : ''">
            <ListChecks class="h-4 w-4" />
            <span>{{ t('nav.tasks') }}</span>
          </RouterLink>
          <div
            class="ml-3 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-900">
            <button type="button" class="rounded px-2 py-1 text-xs font-medium cursor-pointer"
              :class="locale === 'zh-CN' ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : 'text-slate-600 dark:text-slate-300'"
              :title="t('language.switchTo')" @click="changeLocale('zh-CN')">
              {{ t('language.zhCN') }}
            </button>
            <button type="button" class="rounded px-2 py-1 text-xs font-medium cursor-pointer"
              :class="locale === 'en-US' ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : 'text-slate-600 dark:text-slate-300'"
              :title="t('language.switchTo')" @click="changeLocale('en-US')">
              {{ t('language.enUS') }}
            </button>
          </div>
          <div
            class="ml-3 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-900">
            <button type="button" class="inline-flex items-center rounded px-2 py-1 text-xs font-medium cursor-pointer"
              :class="!darkMode ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : 'text-slate-600 dark:text-slate-300'"
              @click="darkMode = false" :title="t('theme.light')">
              <Sun class="h-3.5 w-3.5" />
            </button>
            <button type="button" class="inline-flex items-center rounded px-2 py-1 text-xs font-medium cursor-pointer"
              :class="darkMode ? 'bg-sky-100 text-sky-800 dark:bg-slate-800 dark:text-sky-300' : 'text-slate-600 dark:text-slate-300'"
              @click="darkMode = true" :title="t('theme.dark')">
              <Moon class="h-3.5 w-3.5" />
            </button>
          </div>
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
