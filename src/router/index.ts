import { createRouter, createWebHistory } from 'vue-router'

import ProjectsPage from '../views/ProjectsPage.vue'
import ProjectDetailPage from '../views/ProjectDetailPage.vue'
import TasksPage from '../views/TasksPage.vue'
import TaskDetailPage from '../views/TaskDetailPage.vue'
import NotFoundPage from '../views/NotFoundPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/projects',
    },
    {
      path: '/projects',
      name: 'ProjectsPage',
      component: ProjectsPage,
    },
    {
      path: '/projects/:projectId',
      name: 'ProjectDetailPage',
      component: ProjectDetailPage,
      props: true,
    },
    {
      path: '/tasks',
      name: 'TasksPage',
      component: TasksPage,
    },
    {
      path: '/tasks/:taskId',
      name: 'TaskDetailPage',
      component: TaskDetailPage,
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFoundPage',
      component: NotFoundPage,
    },
  ],
})
