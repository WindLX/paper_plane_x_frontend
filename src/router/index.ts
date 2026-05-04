import { createRouter, createWebHistory } from 'vue-router'

import HomeRedirectPage from '@/views/HomeRedirectPage.vue'
import ProjectDetailPage from '@/views/ProjectDetailPage.vue'
import LibraryPage from '@/views/LibraryPage.vue'
import TasksPage from '@/views/TasksPage.vue'
import TracesPage from '@/views/TracesPage.vue'
import SettingsPage from '@/views/SettingsPage.vue'
import NotFoundPage from '@/views/NotFoundPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'HomeRedirectPage',
      component: HomeRedirectPage,
    },
    {
      path: '/projects/:projectId',
      name: 'ProjectDetailPage',
      component: ProjectDetailPage,
      props: true,
    },
    {
      path: '/library',
      name: 'LibraryPage',
      component: LibraryPage,
    },
    {
      path: '/tasks',
      name: 'TasksPage',
      component: TasksPage,
    },
    {
      path: '/traces',
      name: 'TracesPage',
      component: TracesPage,
    },
    {
      path: '/settings',
      name: 'SettingsPage',
      component: SettingsPage,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFoundPage',
      component: NotFoundPage,
    },
  ],
})
