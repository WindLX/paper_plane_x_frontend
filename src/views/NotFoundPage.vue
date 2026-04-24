<script setup lang="ts">
import { ArrowLeft, Compass } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="flex min-h-[60vh] items-center justify-center">
    <div
      class="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <div
        class="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
        <Compass class="h-6 w-6" />
      </div>
      <h2 class="text-2xl font-semibold text-slate-800 dark:text-slate-200">404</h2>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        The page you requested does not exist.
      </p>
      <div class="mt-6 flex items-center justify-center gap-2">
        <RouterLink to="/projects"
          class="inline-flex items-center gap-1.5 rounded-md border border-sky-300 px-3 py-2 text-sm text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-slate-800">
          <ArrowLeft class="h-4 w-4" />
          <span>Go To Projects</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
