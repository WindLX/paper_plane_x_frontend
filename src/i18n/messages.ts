import { common } from './modules/common'
import { sidebar } from './modules/sidebar'
import { actions } from './modules/actions'
import { dialog } from './modules/dialog'
import { copyable } from './modules/copyable'
import { errors } from './modules/errors'
import { projects } from './modules/projects'
import { tasks } from './modules/tasks'
import { traces } from './modules/traces'
import { library } from './modules/library'
import { paper } from './modules/paper'
import { settings } from './modules/settings'
import { redirect } from './modules/redirect'
import { notFound } from './modules/notFound'

export const messages = {
  'zh-CN': {
    common: common['zh-CN'],
    sidebar: sidebar['zh-CN'],
    actions: actions['zh-CN'],
    dialog: dialog['zh-CN'],
    copyable: copyable['zh-CN'],
    errors: errors['zh-CN'],
    projects: projects['zh-CN'],
    tasks: tasks['zh-CN'],
    traces: traces['zh-CN'],
    library: library['zh-CN'],
    paper: paper['zh-CN'],
    librarian: library['zh-CN'],
    settings: settings['zh-CN'],
    notFound: notFound['zh-CN'],
    redirect: redirect['zh-CN'],
  },
  'en-US': {
    common: common['en-US'],
    sidebar: sidebar['en-US'],
    actions: actions['en-US'],
    dialog: dialog['en-US'],
    copyable: copyable['en-US'],
    errors: errors['en-US'],
    projects: projects['en-US'],
    tasks: tasks['en-US'],
    traces: traces['en-US'],
    library: library['en-US'],
    paper: paper['en-US'],
    settings: settings['en-US'],
    notFound: notFound['en-US'],
    redirect: redirect['en-US'],
  },
} as const
